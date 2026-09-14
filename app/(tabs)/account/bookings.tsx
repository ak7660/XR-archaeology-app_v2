import { AppBar, MainBody, NAVBAR_HEIGHT } from "@/components";
import { Booking, Event } from "@/models";
import { useFeathers } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { Routes } from "@/app/composable/routes";
import { eventWhenLabel, peopleLabel } from "@/app/composable/bookings";
import { eventMoment, isEventPast } from "@/app/composable/event_dates";
import { router, useFocusEffect } from "expo-router";
import _ from "lodash";
import { useCallback, useMemo, useState } from "react";
import { Pressable, RefreshControl, SectionList, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

type Row = Booking & { eventDoc?: Event };

/** Everything the person has booked: upcoming events first (soonest at the top), then past and cancelled. */
export default function MyBookingsPage() {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const { t } = useTranslation();
  const { getLocalizedText } = useLanguage();
  const feathers = useFeathers();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const res = await feathers.service("eventRegistrations").find({ query: { $sort: { createdAt: -1 }, $limit: 100 } });
      const bookings: Booking[] = Array.isArray(res) ? res : res.data;
      const ids = _.uniq(bookings.map((b) => String(b.event)));
      let events: Event[] = [];
      if (ids.length) {
        const evRes = await feathers.service("events").find({ query: { _id: { $in: ids }, $limit: 100, $select: ["_id", "name", "startDate", "endDate"] } });
        events = Array.isArray(evRes) ? evRes : evRes.data;
      }
      const byId = _.keyBy(events, (e) => String(e._id));
      setRows(bookings.map((b) => ({ ...b, eventDoc: byId[String(b.event)] })));
    } catch (error) {
      console.warn("my bookings", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [feathers]);

  // Refresh whenever the screen comes back into view (e.g. after cancelling on an event page).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const sections = useMemo((): { key: string; title: string; data: Row[] }[] => {
    const start = (r: Row) => (r.eventDoc ? new Date(r.eventDoc.startDate).getTime() : 0);
    const isUpcoming = (r: Row) => r.status === "confirmed" && !!r.eventDoc && !isEventPast(r.eventDoc);
    const upcoming = rows.filter(isUpcoming).sort((a, b) => start(a) - start(b));
    const past = rows.filter((r) => !isUpcoming(r)).sort((a, b) => start(b) - start(a));
    return [
      ...(upcoming.length ? [{ key: "upcoming", title: t("booking.upcoming"), data: upcoming }] : []),
      ...(past.length ? [{ key: "past", title: t("booking.pastAndCancelled"), data: past }] : []),
    ];
  }, [rows, t]);

  function renderRow({ item, section }: { item: Row; section: { key: string; title: string } }) {
    const m = eventMoment(item.eventDoc?.startDate);
    const faded = section.key === "past";
    const status = item.status === "cancelled" ? t("booking.statusCancelled") : item.status === "attended" ? t("booking.statusAttended") : "";
    return (
      <Pressable onPress={() => router.push({ pathname: "/home/event", params: { id: String(item.event) } })} style={style.row} accessibilityRole="button">
        <View style={[style.dateBlock, faded && style.dateBlockPast]}>
          <Text variant="headlineSmall" style={style.dateNumber}>
            {m ? m.format("D") : "?"}
          </Text>
          <Text variant="bodySmall" style={style.dateMonth}>
            {m ? m.format("MMM") : ""}
          </Text>
        </View>
        <View style={{ flex: 1, rowGap: 2 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.text }} numberOfLines={2}>
            {item.eventDoc ? getLocalizedText(item.eventDoc.name as any) : "—"}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
            {item.eventDoc ? `${eventWhenLabel(item.eventDoc)}, ` : ""}
            {peopleLabel(item.people || 1, t)}
          </Text>
          {!!status && (
            <Text variant="bodySmall" style={{ color: item.status === "cancelled" ? theme.colors.error : theme.colors.grey2 }}>
              {status}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("booking.myBookings")} showBack />
      <SectionList<Row, { key: string; title: string }>
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={renderRow}
        renderSectionHeader={({ section }) => (
          <Text variant="titleSmall" style={style.sectionHeader}>
            {section.title}
          </Text>
        )}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: NAVBAR_HEIGHT + theme.spacing.xl, rowGap: theme.spacing.sm, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          loading ? null : (
            <View style={style.empty}>
              <Text variant="bodyLarge" style={{ color: theme.colors.text, textAlign: "center" }}>
                {failed ? t("booking.loadFailed") : t("booking.empty")}
              </Text>
              {!failed && (
                <Button mode="contained" onPress={() => router.push(Routes.Events)} textColor={theme.colors.textOnPrimary}>
                  {t("booking.browseEvents")}
                </Button>
              )}
            </View>
          )
        }
      />
    </MainBody>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    sectionHeader: { color: theme.colors.grey2, marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxs },
    row: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: theme.spacing.md,
      padding: theme.spacing.sm,
      backgroundColor: theme.colors.container,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.grey4,
    },
    // The same date block as the events list, slate for bookings that are over.
    dateBlock: {
      width: 56,
      minHeight: 56,
      borderRadius: theme.borderRadius.xs,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    dateBlockPast: { backgroundColor: theme.colors.grey2 },
    dateNumber: { color: theme.colors.textOnPrimary },
    dateMonth: { color: theme.colors.textOnPrimary, fontWeight: "700", marginTop: -6 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", rowGap: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
  });
