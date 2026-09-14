import { Booking, Event, EventAvailability } from "@/models";
import { NumInput } from "@/components";
import { CalendarOutlinedIcon, SuccessCircleIcon } from "@/components/icons";
import { useAuth } from "@/providers/auth_provider";
import { useFeathers } from "@/providers/feathers_provider";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { Routes } from "@/app/composable/routes";
import { describeAuthError, fill } from "@/app/composable/auth_errors";
import { bookButtonLabel, bookingDay, longDay, peopleLabel, placesLeftLabel } from "@/app/composable/bookings";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";

const MAX_ADULTS = 10;
const MAX_CHILDREN = 10;

interface Props {
  event: Event;
}

/**
 * Booking on the event page. One card, whose content follows the visitor:
 * guest -> sign in; unconfirmed email -> confirm; booked -> the booking with a
 * cancel option; otherwise the form (day, people, places left).
 *
 * Rules are enforced by the server (XR-archaeology-server server/feathers/bookings.ts);
 * this only avoids offering what would be refused.
 */
export default function BookingCard({ event }: Props) {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const { t } = useTranslation();
  const feathers = useFeathers();
  const { user } = useAuth();
  const signedIn = !!user?._id;

  const [availability, setAvailability] = useState<EventAvailability>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<string>();
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const av: EventAvailability = await feathers.service("eventAvailability").get(event._id);
      setAvailability(av);
      if (signedIn) {
        const res = await feathers.service("eventRegistrations").find({ query: { event: event._id, status: { $ne: "cancelled" }, $sort: { day: 1 }, $limit: 20 } });
        setBookings(Array.isArray(res) ? res : res.data);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.warn("booking card", error);
    } finally {
      setLoading(false);
    }
  }, [event._id, signedIn]);

  useEffect(() => {
    load();
  }, [load]);

  const bookedDays = useMemo(() => new Set(bookings.map((b) => b.day)), [bookings]);
  /** Days still open to this visitor: not already booked by them. */
  const openDays = useMemo(() => (availability?.days ?? []).filter((d) => !bookedDays.has(d.day)), [availability, bookedDays]);

  // Pick the first day that still has room.
  useEffect(() => {
    if (!openDays.length) return setDay(undefined);
    if (!day || !openDays.some((d) => d.day === day)) {
      setDay((openDays.find((d) => d.left === null || d.left > 0) ?? openDays[0]).day);
    }
  }, [openDays]);

  const selected = openDays.find((d) => d.day === day);
  const people = adults + children;
  const full = !!selected && selected.left !== null && selected.left <= 0;
  const tooMany = !!selected && selected.left !== null && people > selected.left;

  async function book() {
    if (!selected || submitting || full || tooMany) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      await feathers.service("eventRegistrations").create({ event: event._id, day: selected.day, adults, children });
      setShowForm(false);
      setAdults(1);
      setChildren(0);
      await load();
    } catch (error: any) {
      setErrorMsg(error?.code === 400 || error?.code === 409 ? error.message : describeAuthError(error, t));
      load();
    } finally {
      setSubmitting(false);
    }
  }

  function cancel(booking: Booking) {
    Alert.alert(t("booking.cancelTitle"), t("booking.cancelMessage"), [
      { text: t("booking.keep"), style: "cancel" },
      {
        text: t("booking.cancelConfirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await feathers.service("eventRegistrations").patch(booking._id, { status: "cancelled" });
          } catch (error: any) {
            Alert.alert(t("booking.cancel"), error?.message || t("booking.errorGeneric"));
          }
          load();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[style.card, style.center]}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!availability || availability.ended) return null;

  if (!availability.bookingEnabled) {
    return (
      <View style={[style.card, style.row]}>
        <CalendarOutlinedIcon fill={theme.colors.grey2} size={20} />
        <Text variant="bodyMedium" style={{ color: theme.colors.text, flex: 1 }}>
          {t("booking.noBooking")}
        </Text>
      </View>
    );
  }

  const title = (
    <Text variant="titleMedium" style={{ color: theme.colors.text }}>
      {t("booking.title")}
    </Text>
  );

  if (!signedIn) {
    return (
      <View style={style.card}>
        {title}
        <Text variant="bodyMedium" style={{ color: theme.colors.grey2 }}>
          {t("booking.free")}
        </Text>
        <Button mode="contained" onPress={() => router.push(Routes.Login)} style={style.button} textColor={theme.colors.textOnPrimary}>
          {t("booking.signIn")}
        </Button>
        <Button mode="outlined" onPress={() => router.push(Routes.Register)} style={style.button}>
          {t("booking.createAccount")}
        </Button>
      </View>
    );
  }

  const bookedPanels = bookings.map((b) => (
    <View key={b._id} style={style.bookedPanel}>
      <View style={style.row}>
        <SuccessCircleIcon fill={theme.colors.secondary} size={24} />
        <Text variant="titleMedium" style={{ color: theme.colors.secondary }}>
          {t("booking.booked")}
        </Text>
      </View>
      <Text variant="labelLarge" style={{ color: theme.colors.text }}>
        {longDay(b.day)}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
        {peopleLabel(b.adults, b.children, t)}
      </Text>
      {!!user?.email && (
        <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
          {fill(t("booking.emailed"), { email: user.email })}
        </Text>
      )}
      <Button mode="text" compact textColor={theme.colors.error} style={{ alignSelf: "flex-start", marginLeft: -8 }} onPress={() => cancel(b)}>
        {t("booking.cancel")}
      </Button>
    </View>
  ));

  if (bookings.length && !showForm) {
    return (
      <View style={style.card}>
        {bookedPanels}
        {openDays.length > 0 && (
          <Button mode="outlined" onPress={() => setShowForm(true)} style={style.button}>
            {t("booking.bookAnother")}
          </Button>
        )}
      </View>
    );
  }

  if (!user?.verified) {
    return (
      <View style={style.card}>
        {title}
        <Text variant="bodyMedium" style={{ color: theme.colors.grey2 }}>
          {t("booking.confirmEmail")}
        </Text>
        <Button mode="contained" onPress={() => router.push(Routes.VerifyEmail)} style={style.button} textColor={theme.colors.textOnPrimary}>
          {t("booking.confirmEmailButton")}
        </Button>
      </View>
    );
  }

  if (!openDays.length) return bookings.length ? <View style={style.card}>{bookedPanels}</View> : null;

  return (
    <View style={style.card}>
      {bookedPanels}
      {title}

      {/* Day: a row of date tiles for a multi-day event, a plain date for a one-day one. */}
      {availability.days.length > 1 ? (
        <View style={{ rowGap: theme.spacing.xs }}>
          <Text variant="labelMedium" style={{ color: theme.colors.grey2 }}>
            {t("booking.day")}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ columnGap: theme.spacing.xs }}>
            {openDays.map((d) => {
              const m = bookingDay(d.day);
              const isSelected = d.day === day;
              const isFull = d.left !== null && d.left <= 0;
              return (
                <Pressable
                  key={d.day}
                  onPress={() => setDay(d.day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: isFull }}
                  accessibilityLabel={`${longDay(d.day)}${isFull ? `, ${t("booking.full_short")}` : ""}`}
                  style={[style.dayTile, isSelected && style.dayTileSelected, isFull && !isSelected && style.dayTileFull]}
                >
                  <Text variant="bodySmall" style={[style.dayTileText, isSelected && style.dayTileTextSelected]}>
                    {m.format("ddd")}
                  </Text>
                  <Text variant="headlineSmall" style={[style.dayTileText, isSelected && style.dayTileTextSelected, { marginVertical: -4 }]}>
                    {m.format("D")}
                  </Text>
                  <Text variant="bodySmall" style={[style.dayTileText, isSelected && style.dayTileTextSelected]}>
                    {isFull ? t("booking.full_short") : m.format("MMM")}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        !!selected && (
          <View style={style.row}>
            <CalendarOutlinedIcon fill={theme.colors.primary} size={20} />
            <Text variant="labelLarge" style={{ color: theme.colors.text }}>
              {longDay(selected.day)}
            </Text>
          </View>
        )
      )}

      <View style={style.counterRow}>
        <Text variant="labelLarge" style={{ color: theme.colors.text }}>
          {t("booking.adults")}
        </Text>
        <NumInput inputValue={adults} onChange={setAdults} min={1} max={MAX_ADULTS} />
      </View>
      <View style={style.counterRow}>
        <View>
          <Text variant="labelLarge" style={{ color: theme.colors.text }}>
            {t("booking.children")}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
            {t("booking.childrenHint")}
          </Text>
        </View>
        <NumInput inputValue={children} onChange={setChildren} min={0} max={MAX_CHILDREN} />
      </View>

      {selected && selected.left !== null && (
        <Text variant="bodySmall" style={{ color: full || tooMany ? theme.colors.error : theme.colors.grey2 }}>
          {placesLeftLabel(selected.left, t)}
        </Text>
      )}

      <Button
        mode="contained"
        onPress={book}
        loading={submitting}
        disabled={submitting || !selected || full || tooMany}
        style={style.button}
        textColor={theme.colors.textOnPrimary}
      >
        {bookButtonLabel(people, t)}
      </Button>
      {!!errorMsg && <Text style={{ color: theme.colors.error }}>{errorMsg}</Text>}
    </View>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.md,
      rowGap: theme.spacing.sm,
      backgroundColor: theme.colors.container,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.grey4,
    },
    center: { alignItems: "center", justifyContent: "center", minHeight: 80 },
    row: { flexDirection: "row", alignItems: "center", columnGap: theme.spacing.xs },
    counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    button: { borderRadius: theme.borderRadius.sm, marginTop: theme.spacing.xxs },
    // Same vocabulary as the date blocks on the events list.
    dayTile: {
      width: 60,
      paddingVertical: theme.spacing.xs,
      alignItems: "center",
      borderRadius: theme.borderRadius.sm,
      borderWidth: 1,
      borderColor: theme.colors.grey4,
      backgroundColor: theme.colors.container,
    },
    dayTileSelected: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    dayTileFull: { opacity: 0.5 },
    dayTileText: { color: theme.colors.text },
    dayTileTextSelected: { color: theme.colors.textOnPrimary, fontWeight: "700" },
    bookedPanel: {
      padding: theme.spacing.md,
      rowGap: theme.spacing.xxs,
      borderRadius: theme.borderRadius.sm,
      backgroundColor: theme.colors.primary + "14",
      borderWidth: 1,
      borderColor: theme.colors.primary + "55",
    },
  });
