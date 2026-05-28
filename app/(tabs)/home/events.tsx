import { AppBar, EventItem, LoadingPage, MainBody, NAVBAR_HEIGHT } from "@/components";
import { SortIcon } from "@/components/icons";
import { Event } from "@/models";
import { Paginated, useFeathers } from "@/providers/feathers_provider";
import { useAppTheme, AppTheme } from "@/providers/style_provider";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Calendar, CalendarUtils, DateData } from "react-native-calendars";
import { MarkedDates } from "react-native-calendars/src/types";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistance } from "@/plugins/utils";

function getDateBorder(date: Date, type: 'end' | 'start') {
  if (type === 'end') {
    date.setHours(23);
    date.setMinutes(59);
  }
  if (type === 'start') {
    date.setHours(0);
    date.setMinutes(0);
  }
  return date;
}

function getDateArrayBetweenTimestamps(startTimestamp, endTimestamp) {
  let dates: string[] = [];
  let currentTimestamp = startTimestamp;
  if (startTimestamp > endTimestamp) {
    throw new Error("Date error");
  }
  while (currentTimestamp <= endTimestamp) {
    let date = new Date(currentTimestamp);
    let formattedDate = CalendarUtils.getCalendarDateString(date);
    dates.push(formattedDate);
    currentTimestamp += 24 * 60 * 60 * 1000;
  }

  return dates;
}

export default function Page() {
  const feathers = useFeathers();
  const { theme } = useAppTheme();
  const style = useStyle({ theme });
  const [loaded, setLoaded] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [isSorted, setIsSorted] = useState(false);
  const { location: userLocation } = useLocation();

  const initDate = CalendarUtils.getCalendarDateString(new Date());
  const minDate = initDate;
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const markedDates: MarkedDates = useMemo(() => {
    const actDates: Record<string, { marked: boolean }> = {};
    events.forEach((event) => {
      const evt_dates = getDateArrayBetweenTimestamps(new Date(event.startDate).getTime(), new Date(event.endDate).getTime());
      evt_dates.forEach((date_str) => {
        actDates[date_str] = {
          marked: true,
        };
      });
    });
    if (!selectedDate) return actDates;
    const result = Object.assign(
      actDates,
      {
        [selectedDate]: {
          selected: true,
          selectedColor: theme.colors.primary,
          selectedTextColor: theme.colors.textOnPrimary,
          customTextStyle: { textAlignVertical: "center" },
        },
      },
    );
    return result;
  }, [selectedDate, events]);

  const shown_events =  useMemo(() => {
    let filtered = events;
    if (selectedDate) {
      filtered = events.filter(evt => {
        const selected_ts = new Date(selectedDate).getTime();
        const start = getDateBorder(new Date(evt.startDate), 'start')
        const end = getDateBorder(new Date(evt.endDate), 'end')
        return selected_ts >= start.getTime() && selected_ts <= end.getTime();
      });
    }

    if (isSorted && userLocation) {
      filtered = [...filtered].sort((a, b) => {
        // Extract coordinates from event or its venue attraction
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
  }, [selectedDate, events, isSorted, userLocation])

  const onDayPress = useCallback((day: DateData) => {
    setSelectedDate(day.dateString);
  }, []);
  const clearDay = useCallback(() => {
    setSelectedDate(null);
  }, []);

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
        <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: theme.spacing.sm }}>
          <Button
            buttonColor="transparent"
            mode="outlined"
            style={style.outlinedButton}
            labelStyle={{ marginVertical: theme.spacing.xs, marginHorizontal: theme.spacing.md }}
            onPress={clearDay}
          >
            <Text variant="labelSmall" style={style.buttonText}>
              Reset selected day
            </Text>
          </Button>
          <TouchableOpacity 
            onPress={() => setIsSorted(!isSorted)}
            style={{ 
              backgroundColor: isSorted ? theme.colors.primary : theme.colors.surface, 
              padding: 10, 
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.outline
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
          theme={{
            calendarBackground: "transparent",
            textSectionTitleColor: theme.colors.text,
            monthTextColor: theme.colors.text,
            dayTextColor: theme.colors.text,
            textDisabledColor: theme.colors.grey2,
          }}
        />
      </View>
      {!loaded ? (
        <LoadingPage />
      ) : (
        <FlatList
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: theme.spacing.lg,
            paddingBottom: NAVBAR_HEIGHT + theme.spacing.md,
            paddingHorizontal: theme.spacing.sm,
          }}
          data={shown_events}
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

    outlinedButton: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: 999,
      maxHeight: 34,
    },
    buttonText: {
      color: theme.colors.primary,
      textAlignVertical: "center",
    },
  });
