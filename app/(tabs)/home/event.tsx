import { AppBar, Carousel, MainBody, NAVBAR_HEIGHT, NumInput, ErrorPage, LoadingPage } from "@/components";
import { CalendarIcon, CalendarOutlinedIcon, LocationIcon, ProfileIcon } from "@/components/icons";
import { Event } from "@/models";
import { useAuth } from "@/providers/auth_provider";
import { useFeathers } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

/** A time is only worth showing if the editor actually set one.
 *
 * `startDate`/`endDate` are full timestamps, but an all-day event is stored as
 * midnight. Printing "00:00" for those is noise, so times are shown only when
 * at least one end of the event carries a real time.
 */
function hasMeaningfulTime(start?: Date | string, end?: Date | string) {
  return [start, end].some((value) => {
    if (!value) return false;
    const m = moment(value);
    return m.isValid() && (m.hours() !== 0 || m.minutes() !== 0);
  });
}

export default function Page() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const feathers = useFeathers();
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { getLocalizedText } = useLanguage();
  const style = useStyle({ theme });

  const [event, setEvent] = useState<Event>();
  const [venueName, setVenueName] = useState<string>();
  const [loaded, setLoaded] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [selectedDates, setSelectedDates] = useState([]);

  const authenticated: boolean = !!(user && user._id);

  useEffect(() => {
    async function init() {
      try {
        if (!id) return;
        const res = await feathers.service("events").get(id, { query: { $populate: ["venue"] } });
        setEvent(res);
        //   fetch venue name if $populate not working
        if (typeof res.venue === "string") {
          const venue = await feathers.service("attractions").get(res.venue, { query: { $select: ["name"] } });
          setVenueName(getLocalizedText(venue.name));
        } else {
          setVenueName(getLocalizedText(res.venue?.name));
        }
      } catch (error) {
        console.warn(error);
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, []);

  const showTime = useMemo(() => hasMeaningfulTime(event?.startDate, event?.endDate), [event]);
  const dateFormat = showTime ? "ddd, D MMM YYYY" : "ddd, D MMM YYYY";

  /** One line per date, with the time on its own row when there is one. */
  function formatWhen(value?: Date) {
    if (!value) return { date: "", time: "" };
    const m = moment(value);
    if (!m.isValid()) return { date: "", time: "" };
    return { date: m.format(dateFormat), time: showTime ? m.format("HH:mm") : "" };
  }

  const start = formatWhen(event?.startDate);
  const end = event?.endDate ? formatWhen(event.endDate) : null;
  const sameDay = !!(event?.endDate && moment(event.startDate).isSame(moment(event.endDate), "day"));

  /** A single row of the details card.
   *
   * The icon sits in a fixed-size badge and the text in a flexed column, so a
   * longer label can never push the icon onto its own line - the previous
   * layout used a fixed-width wrapping header, which is why "Start Date" and
   * "End Date" ended up aligned differently.
   */
  function DetailRow({
    icon,
    label,
    value,
    hint,
    last,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    hint?: string;
    last?: boolean;
  }) {
    if (!value) return null;
    return (
      <View style={[style.detailRow, !last && style.detailRowDivider]}>
        <View style={style.iconBadge}>{icon}</View>
        <View style={style.detailText}>
          <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
            {label}
          </Text>
          <Text variant="labelMedium" style={{ color: theme.colors.text }}>
            {value}
          </Text>
        </View>
        {!!hint && (
          <Text variant="labelMedium" style={style.hint}>
            {hint}
          </Text>
        )}
      </View>
    );
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar showBack />
      {!loaded ? (
        <LoadingPage />
      ) : event ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.md }}>
          {event.images && <Carousel images={event.images} />}

          <View style={style.topSection}>
            <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
              {getLocalizedText(event.name)}
            </Text>
            {!!event.briefDesc && (
              <Text variant="bodyMedium" style={{ color: theme.colors.grey2 }}>
                {getLocalizedText(event.briefDesc)}
              </Text>
            )}
          </View>

          {/* When & where */}
          <View style={style.card}>
            <DetailRow
              icon={<CalendarOutlinedIcon fill={theme.colors.primary} size={20} />}
              label={sameDay ? "Date" : "Starts"}
              value={start.date}
              hint={start.time}
              last={!end && !venueName}
            />
            {end && !sameDay && (
              <DetailRow
                icon={<CalendarIcon fill={theme.colors.primary} size={20} />}
                label="Ends"
                value={end.date}
                hint={end.time}
                last={!venueName}
              />
            )}
            {end && sameDay && showTime && (
              <DetailRow
                icon={<CalendarIcon fill={theme.colors.primary} size={20} />}
                label="Time"
                value={`${start.time} - ${end.time}`}
                last={!venueName}
              />
            )}
            {!!venueName && (
              <DetailRow icon={<LocationIcon fill={theme.colors.primary} size={20} />} label="Venue" value={venueName} last />
            )}
          </View>

          {/* Full description */}
          {!!event.content && (
            <View style={style.contentSection}>
              <Text variant="bodyMedium" style={{ color: theme.colors.text, lineHeight: 22 }}>
                {getLocalizedText(event.content)}
              </Text>
            </View>
          )}

          {/* Reservation */}
          {authenticated && (
            <View style={{ marginBottom: theme.spacing.lg }}>
              <Text variant="titleMedium" style={style.sectionTitle}>
                Reservation
              </Text>

              <View style={[style.row, style.personSection]}>
                <ProfileIcon fill={theme.colors.text} size={24} />
                <View style={{ flexDirection: "column", gap: theme.spacing.xs, flex: 1 }}>
                  <View style={style.personRow}>
                    <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                      Adults
                    </Text>
                    <NumInput inputValue={adults} onChange={setAdults} min={0} />
                  </View>
                  <View style={style.personRow}>
                    <View style={{ flexDirection: "column" }}>
                      <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                        Children
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
                        Ages 0 to 17
                      </Text>
                    </View>
                    <NumInput inputValue={children} onChange={setChildren} min={0} />
                  </View>
                </View>
              </View>

              {/* Date & Time */}
              <View style={[style.row, style.dateTimeSection]}>
                <CalendarOutlinedIcon fill={theme.colors.text} size={24} />
                <Text variant="labelMedium" style={{ color: theme.colors.text, flex: 1 }}>
                  Date & Time
                </Text>
                <Button>{selectedDates && selectedDates.length ? moment(selectedDates[0]).format("DD MMM, YYYY") : "Select a day"}</Button>
              </View>
            </View>
          )}

          {/* Footer */}
          <View style={style.footer}>
            <Button
              mode="contained"
              style={{ borderRadius: theme.borderRadius.sm }}
              contentStyle={{ paddingVertical: theme.spacing.xxs }}
              textColor={theme.colors.textOnPrimary}
            >
              {authenticated ? "Book now" : "Sign up to book now"}
            </Button>
          </View>
        </ScrollView>
      ) : (
        <ErrorPage message="Details for this item aren't available" />
      )}
    </MainBody>
  );
}

const useStyle = ({ theme }: { theme: AppTheme }) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignContent: "center" },
    topSection: {
      flexDirection: "column",
      paddingHorizontal: theme.spacing.lg,
      rowGap: theme.spacing.xs,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    card: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.container,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.grey4,
      overflow: "hidden",
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    detailRowDivider: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.grey4,
    },
    // Fixed square badge: the icon can never wrap away from its label, which
    // is what misaligned the old Start/End rows.
    iconBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.background,
    },
    detailText: {
      flex: 1,
      flexDirection: "column",
      rowGap: 2,
    },
    hint: {
      color: theme.colors.primary,
      marginLeft: theme.spacing.sm,
    },
    contentSection: {
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xs,
      color: theme.colors.text,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    personSection: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      columnGap: theme.spacing.sm,
    },
    personRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    dateTimeSection: {
      paddingLeft: theme.spacing.lg,
      paddingRight: theme.spacing.xxs,
      columnGap: theme.spacing.sm,
    },
    footer: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.lg,
    },
  });
