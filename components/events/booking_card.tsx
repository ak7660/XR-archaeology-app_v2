import { Booking, Event, EventAvailability } from "@/models";
import { NumInput } from "@/components";
import { CalendarOutlinedIcon, SuccessCircleIcon } from "@/components/icons";
import { useAuth } from "@/providers/auth_provider";
import { useFeathers } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { Routes } from "@/app/composable/routes";
import { describeAuthError, fill } from "@/app/composable/auth_errors";
import { eventWhenLabel, peopleLabel, placesLeftLabel } from "@/app/composable/bookings";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";

const MAX_PEOPLE = 10;

interface Props {
  event: Event;
}

/**
 * Booking on the event page, kept deliberately simple: pick how many people,
 * tap "Book now", confirm, done. One booking per person per event; once booked
 * the card shows it with a cancel option.
 *
 * Guests are asked to sign in or create an account; unconfirmed emails to
 * confirm. Rules are enforced by the server (XR-archaeology-server
 * server/feathers/bookings.ts) - any refusal is shown in its own words.
 */
export default function BookingCard({ event }: Props) {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();
  const feathers = useFeathers();
  const { user } = useAuth();
  const signedIn = !!user?._id;

  const [availability, setAvailability] = useState<EventAvailability>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const load = useCallback(async () => {
    try {
      setAvailability(await feathers.service("eventAvailability").get(event._id));
      if (signedIn) {
        const res = await feathers.service("eventRegistrations").find({ query: { event: event._id, status: { $ne: "cancelled" }, $limit: 1 } });
        const list: Booking[] = Array.isArray(res) ? res : res.data;
        setBooking(list[0] ?? null);
      } else {
        setBooking(null);
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

  const eventName = getLocalizedText(event.name as any);
  const left = availability?.left ?? null;
  const maxPeople = left === null ? MAX_PEOPLE : Math.max(1, Math.min(MAX_PEOPLE, left));

  async function book() {
    setErrorMsg("");
    setSubmitting(true);
    try {
      const created: Booking = await feathers.service("eventRegistrations").create({ event: event._id, people: Math.min(people, maxPeople) });
      setBooking(created);
      Alert.alert(t("booking.booked"), user?.email ? fill(t("booking.emailed"), { email: user.email }) : undefined);
      load();
    } catch (error: any) {
      // The server's refusals ("This event is fully booked.", "Confirm your email...") are written for people.
      setErrorMsg(error?.code >= 400 && error?.code < 500 && error?.message ? error.message : describeAuthError(error, t));
      load();
    } finally {
      setSubmitting(false);
    }
  }

  /** "Are you sure?" before anything is saved. */
  function confirmBooking() {
    if (submitting) return;
    const details = [eventName, eventWhenLabel(event), peopleLabel(Math.min(people, maxPeople), t)].filter(Boolean).join("\n");
    Alert.alert(t("booking.confirmTitle"), details, [
      { text: t("auth.cancel"), style: "cancel" },
      { text: t("booking.confirmBook"), onPress: book },
    ]);
  }

  function confirmCancel() {
    if (!booking) return;
    Alert.alert(t("booking.cancelTitle"), t("booking.cancelMessage"), [
      { text: t("booking.keep"), style: "cancel" },
      {
        text: t("booking.cancelConfirm"),
        style: "destructive",
        onPress: async () => {
          try {
            await feathers.service("eventRegistrations").patch(booking._id, { status: "cancelled" });
            setBooking(null);
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

  // Booked: that's all there is to show.
  if (booking) {
    return (
      <View style={[style.card, style.bookedCard]}>
        <View style={style.row}>
          <SuccessCircleIcon fill={theme.colors.secondary} size={24} />
          <Text variant="titleMedium" style={{ color: theme.colors.secondary }}>
            {t("booking.booked")}
          </Text>
        </View>
        <Text variant="bodyLarge" style={{ color: theme.colors.text }}>
          {peopleLabel(booking.people, t)}
        </Text>
        {!!user?.email && (
          <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
            {fill(t("booking.emailed"), { email: user.email })}
          </Text>
        )}
        <Button mode="text" compact textColor={theme.colors.error} style={{ alignSelf: "flex-start", marginLeft: -8 }} onPress={confirmCancel}>
          {t("booking.cancel")}
        </Button>
      </View>
    );
  }

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

  if (left === 0) {
    return (
      <View style={style.card}>
        {title}
        <Text variant="bodyMedium" style={{ color: theme.colors.grey2 }}>
          {t("booking.full")}
        </Text>
      </View>
    );
  }

  return (
    <View style={style.card}>
      {title}
      <View style={style.counterRow}>
        <Text variant="labelLarge" style={{ color: theme.colors.text }}>
          {t("booking.people")}
        </Text>
        <NumInput inputValue={Math.min(people, maxPeople)} onChange={setPeople} min={1} max={maxPeople} />
      </View>
      {left !== null && (
        <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
          {placesLeftLabel(left, t)}
        </Text>
      )}
      <Button mode="contained" onPress={confirmBooking} loading={submitting} disabled={submitting} style={style.button} textColor={theme.colors.textOnPrimary}>
        {t("booking.bookNow")}
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
    bookedCard: {
      backgroundColor: theme.colors.primary + "14",
      borderColor: theme.colors.primary + "55",
    },
    center: { alignItems: "center", justifyContent: "center", minHeight: 80 },
    row: { flexDirection: "row", alignItems: "center", columnGap: theme.spacing.xs },
    counterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    button: { borderRadius: theme.borderRadius.sm, marginTop: theme.spacing.xxs },
  });
