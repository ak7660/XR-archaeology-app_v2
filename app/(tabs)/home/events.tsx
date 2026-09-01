import { AppBar, EventItem, LoadingPage, MainBody, NAVBAR_HEIGHT } from "@/components";
import { SortIcon } from "@/components/icons";
import { Event } from "@/models";
import { Paginated, useFeathers } from "@/providers/feathers_provider";
import { useAppTheme, AppTheme } from "@/providers/style_provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Calendar, CalendarUtils, DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { Button, Text } from "react-native-paper";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistance } from "@/plugins/utils";
import { useLocalizedText } from "@/hooks/useLocalizedText";
import { eventOverlapsRange, getEventDateStrings, nextRange } from "@/app/composable/event_dates";

export default function Page() {
  const feathers = useFeathers();
  const { theme } = useAppTheme();
  const style = useStyle({ theme });
  const localize = useLocalizedText();
  const [loaded, setLoaded] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isSorted, setIsSorted] = useState(false);
  const { location: userLocation } = useLocation();

  const initDate = CalendarUtils.getCalendarDateString(new Date());
  const minDate = initDate;

  /** The chosen range. `end` stays null until a second day is picked. */
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const hasRange = !!startDate && !!endDate;

  /** Events we are willing to show at all.
   *
   * Records with no name in any language render as a blank card and, because
   * some of them span a year or more, dot the entire calendar. They are test
   * leftovers rather than real events, so they are excluded from both.
   */
  const displayableEvents = useMemo(
    () => events.filter((event) => !!(typeof event.name === "string" ? event.name : localize(event.name))?.trim()),
    [events, localize]
  );

  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {};

    // Dots for days that actually have an event.
    displayableEvents.forEach((event) => {
      getEventDateStrings(new Date(event.startDate), new Date(event.endDate)).forEach((day) => {
        marks[day] = { ...(marks[day] ?? {}), marked: true, dotColor: theme.colors.primary };
      });
    });

    // The selected range painted on top.
    if (startDate) {
      const rangeEnd = endDate ?? startDate;
      const days = getEventDateStrings(new Date(startDate), new Date(rangeEnd));
      days.forEach((day, index) => {
        marks[day] = {
          ...(marks[day] ?? {}),
          color: theme.colors.primary,
          textColor: theme.colors.textOnPrimary,
          startingDay: index === 0,
          endingDay: index === days.length - 1,
        };
      });
    }

    return marks;
  }, [displayableEvents, startDate, endDate, theme]);

  const shownEvents = useMemo(() => {
    // Nothing is listed until a full range is chosen - the empty state below
    // explains why, rather than silently showing every event.
    if (!hasRange) return [];

    const rangeStart = new Date(startDate!);
    const rangeEnd = new Date(endDate!);

    let filtered = displayableEvents.filter((event) =>
      eventOverlapsRange(new Date(event.startDate), event.endDate ? new Date(event.endDate) : null, rangeStart, rangeEnd)
    );

    if (isSorted && userLocation) {
      filtered = [...filtered].sort((a, b) => {
        const aLat = a.latitude || (typeof a.venue !== "string" && a.venue?.latitude);
        const aLon = a.longitude || (typeof a.venue !== "string" && a.venue?.longitude);
        const bLat = b.latitude || (typeof b.venue !== "string" && b.venue?.latitude);
        const bLon = b.longitude || (typeof b.venue !== "string" && b.venue?.longitude);

        if (!aLat || !aLon) return 1;
        if (!bLat || !bLon) return -1;

        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, aLat as number, aLon as number);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, bLat as number, bLon as number);
        return distA - distB;
      });
    }

    return filtered;
  }, [hasRange, startDate, endDate, displayableEvents, isSorted, userLocation]);

  const onDayPress = useCallback(
    (day: DateData) => {
      const next = nextRange({ start: startDate, end: endDate }, day.dateString);
      setStartDate(next.start);
      setEndDate(next.end);
    },
    [startDate, endDate]
  );

  const resetDates = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
  }, []);

  const rangeLabel = useMemo(() => {
    if (!startDate) return "Select a start date";
    if (!endDate) return `${startDate}  →  select an end date`;
    return `${startDate}  →  ${endDate}`;
  }, [startDate, endDate]);

  useEffect(() => {
    async function init() {
      try {
        const res: Paginated<Event> = await feathers.service("events").find({ query: { $sort: "startDate,order" } });
        setEvents(res.data);
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, []);

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar showBack title="What's Hot!" />
      <View style={style.calendarContainer}>
        <View style={style.toolbar}>
          <Text variant="labelSmall" style={style.rangeLabel} numberOfLines={1}>
            {rangeLabel}
          </Text>
          <Button
            buttonColor="transparent"
            mode="outlined"
            style={[style.outlinedButton, !startDate && style.outlinedButtonDisabled]}
            labelStyle={{ marginVertical: theme.spacing.xs, marginHorizontal: theme.spacing.sm }}
            onPress={resetDates}
            disabled={!startDate}
          >
            <Text variant="labelSmall" style={[style.buttonText, !startDate && { color: theme.colors.grey3 }]}>
              Reset
            </Text>
          </Button>
          <TouchableOpacity
            onPress={() => setIsSorted(!isSorted)}
            style={{
              backgroundColor: isSorted ? theme.colors.primary : theme.colors.surface,
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            }}
          >
            <SortIcon fill={isSorted ? theme.colors.onPrimary : theme.colors.onSurface} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <Calendar
          enableSwipeMonths
          current={initDate}
          minDate={minDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          markingType="period"
          theme={{
            calendarBackground: "transparent",
            textSectionTitleColor: theme.colors.text,
            monthTextColor: theme.colors.text,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.grey3,
            dotColor: theme.colors.primary,
          }}
        />
      </View>
      {!loaded ? (
        <LoadingPage />
      ) : !hasRange ? (
        <View style={style.emptyState}>
          <Text variant="labelLarge" style={{ color: theme.colors.text, textAlign: "center" }}>
            {startDate ? "Now pick an end date" : "Select your dates"}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.grey2, textAlign: "center" }}>
            {startDate
              ? "Tap another day on the calendar to finish the range."
              : "Tap a start date and then an end date to see what's on. Days with events are dotted."}
          </Text>
        </View>
      ) : shownEvents.length === 0 ? (
        <View style={style.emptyState}>
          <Text variant="labelLarge" style={{ color: theme.colors.text, textAlign: "center" }}>
            Nothing on these dates
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.grey2, textAlign: "center" }}>
            Try a different range - dotted days on the calendar have events.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: theme.spacing.lg,
            paddingBottom: NAVBAR_HEIGHT + theme.spacing.md,
            paddingHorizontal: theme.spacing.sm,
          }}
          data={shownEvents}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.md }} />}
          renderItem={({ item }) => {
            return <EventItem {...item} />;
          }}
        />
      )}
    </MainBody>
  );
}

const useStyle = ({ theme }: { theme: AppTheme }) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignContent: "center" },
    calendarContainer: {
      flexDirection: "column",
      backgroundColor: theme.colors.container,
      borderBottomRightRadius: theme.borderRadius.md,
      borderBottomLeftRadius: theme.borderRadius.md,
      overflow: "hidden",
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.lg,

      elevation: 4,
      shadowColor: theme.colors.shadowColor,
      shadowRadius: 4,
      shadowOpacity: 0.75,
      shadowOffset: { height: 12, width: 0 },
    },
    toolbar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
    },
    rangeLabel: {
      flex: 1,
      color: theme.colors.grey2,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xl,
    },

    outlinedButton: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      maxHeight: 34,
    },
    outlinedButtonDisabled: {
      borderColor: theme.colors.grey4,
    },
    buttonText: {
      color: theme.colors.primary,
      textAlignVertical: "center",
    },
  });
