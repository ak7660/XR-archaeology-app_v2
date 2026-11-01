import { Routes } from "@/app/composable/routes";
import { AppBar, ListItem, ListItemProps, MainBody, NAVBAR_HEIGHT } from "@/components";

import { Attraction, OpenHour, Weekday } from "@/models";
import { Paginated, useFeathers } from "@/providers/feathers_provider";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useLocalizedText } from "@/hooks/useLocalizedText";
import { useTranslation } from "@/hooks/useTranslation";
import { Link, useLocalSearchParams } from "expo-router";
import _ from "lodash";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Text } from "react-native-paper";
import { TabView, SceneMap } from "react-native-tab-view";
import { useNearby } from "@/hooks/useNearby";
import NearbySortButton from "@/components/common/nearby_sort";
import { distanceKm, formatDistance } from "@/app/composable/nearby";

interface BusinessHour {
  openTime: Date;
  closeTime: Date;
}

export default function Page() {
  const { theme } = useAppTheme();
  const layout = useWindowDimensions();
  const style = useStyle({ theme });
  const feathers = useFeathers();
  const localize = useLocalizedText();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ type: string }>();
  const tabRoutes = [
    { key: "Resturants", title: t("home.restaurants") },
    { key: "Accommodations", title: t("home.accommodations") },
  ];
  const [tabIndex, setTabIndex] = useState(tabRoutes.findIndex((tab) => tab.key === params?.type) ?? 0);

  const [items, setItems] = useState<Attraction[]>([]);
  const nearby = useNearby();

  const sortedItems = useMemo(() => {
    return nearby.sort(items.slice(), (item) => item);
  }, [items, nearby.enabled, nearby.position]);

  const restaurants = useMemo(() => sortedItems.filter((it) => it.type === "Restaurant"), [sortedItems]);
  const lodgings = useMemo(() => sortedItems.filter((it) => it.type === "Lodging"), [sortedItems]);

  useEffect(() => {
    async function init() {
      try {
        const res: Paginated<Attraction> = await feathers.service("attractions").find({
          query: { type: { $in: ["Restaurant", "Lodging"] }, $sort: "type", $limit: 20 },
        });
        setItems(res.data);
      } catch (error) {
        console.warn("Cannot fetch attractions", error);
      }
    }
    init();
  }, []);

  function compareInterval(a: BusinessHour, b: BusinessHour) {
    return a.openTime.getTime() - b.openTime.getTime();
  }

  function mergeIntervals(list: BusinessHour[]) {
    if (!list.length) return;

    let stack: BusinessHour[] = [];
    list.sort(compareInterval);
    stack.push(list[0]);

    for (let i = 1; i < list.length; i++) {
      let top = stack[stack.length - 1];
      if (top.closeTime < list[i].openTime) {
        stack.push(list[i]);
      } else if (top.closeTime < list[i].closeTime) {
        top.closeTime = list[i].closeTime;
        stack.pop();
        stack.push(top);
      }
    }
    return stack;
  }

  function getOpenHoursText(hours?: OpenHour[]): string | undefined {
    if (!hours || !hours.length) return;
    const now = new Date();
    const prefix = moment().format("YYYY-MM-DD");
    const weekdays: Weekday[] = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const day: Weekday = weekdays[now.getDay()];
    let res: Record<Weekday, BusinessHour[] | undefined> = Object.fromEntries(weekdays.map((day) => [day]));

    for (const hour of hours) {
      const { openTime, closeTime, days } = hour;
      if (!days) continue;
      for (const d of days) {
        res[d] ??= [];
        res[d]?.push({ openTime: new Date(prefix + "T" + openTime), closeTime: new Date(prefix + "T" + closeTime) });
      }
    }
    const newRes = Object.entries(res).reduce((acc, cur) => {
      acc[cur[0]] = mergeIntervals(cur[1] ?? []);
      return acc;
    }, {});

    const curHours: BusinessHour[] | undefined = newRes[day];
    if (!curHours) return;
    for (const hour of curHours) {
      if (hour.openTime <= now && hour.closeTime >= now) return `Opening · Close Time: ${moment(hour.closeTime).format("HH:mm")}`;
      else if (hour.openTime > now) return `Closed · Open Time: ${moment(hour.openTime).format("HH:mm")}`;
      else if (hour.closeTime < now) continue;
    }
  }

  const ResturantView = () => {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.md }}>
        <View style={style.sectionHeader}>
          <NearbySortButton status={nearby.status} onPress={nearby.toggle} />
          <Link href={{ pathname: Routes.Attractions, params: { type: "Restaurant" } }} asChild>
            <Pressable style={style.button}>
              <Text variant="labelMedium" style={{ color: theme.colors.grey3 }}>
                view all
              </Text>
            </Pressable>
          </Link>
        </View>
        {restaurants && (
          <View style={style.list}>
            {restaurants.map((item) => {
              const openHour = getOpenHoursText(item.businessHours);
              const localizedBrief = localize(item.briefDesc);
              const brief = localizedBrief ? `${localizedBrief}\n${openHour ?? ""}` : openHour;

              // Debug logging for coordinates
              // console.log(`Item: ${item.name.en}, Lat: ${item.latitude}, Lon: ${item.longitude}`);

              const props: ListItemProps = {
                name: item.name,
                briefDesc: brief,
                showNavigate: true,
                latitude: item.latitude,
                longitude: item.longitude,
                images: item.thumbnails,
                distance: formatDistance(distanceKm(nearby.position, item)),
                href: { pathname: Routes.Detail, params: { id: item._id, service: "attractions" } },
              };
              return <ListItem {...props} key={item._id} />;
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const AccommodationView = () => {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.md }}>
        <View style={style.sectionHeader}>
          <NearbySortButton status={nearby.status} onPress={nearby.toggle} />
          <Link href={{ pathname: Routes.Attractions, params: { type: "Lodging" } }} asChild>
            <Pressable style={style.button}>
              <Text variant="labelMedium" style={{ color: theme.colors.grey3 }}>
                view all
              </Text>
            </Pressable>
          </Link>
        </View>
        {lodgings && (
          <View style={style.list}>
            {lodgings.map((item) => {
              // Debug logging for coordinates
              // console.log(`Item: ${item.name.en}, Lat: ${item.latitude}, Lon: ${item.longitude}`);

              const props: ListItemProps = {
                name: item.name,
                briefDesc: item.briefDesc,
                showNavigate: true,
                latitude: item.latitude,
                longitude: item.longitude,
                images: item.thumbnails,
                distance: formatDistance(distanceKm(nearby.position, item)),
                href: { pathname: Routes.Detail, params: { id: item._id, service: "attractions" } },
              };
              return <ListItem {...props} key={item._id} />;
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderScene = SceneMap({
    Resturants: ResturantView,
    Accommodations: AccommodationView,
  });

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar showBack title={t("home.foodAndLodging")} />
      <TabView
        navigationState={{ index: tabIndex, routes: tabRoutes }}
        renderScene={renderScene}
        onIndexChange={setTabIndex}
        initialLayout={{ width: layout.width }}
      />
    </MainBody>
  );
}

const useStyle = ({ theme }: { theme: AppTheme }) =>
  StyleSheet.create({
    sectionHeader: {
      paddingLeft: theme.spacing.lg,
      paddingRight: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      flexDirection: "row",
      alignContent: "center",
      justifyContent: "space-between",
    },
    title: {
      textAlignVertical: "center",
    },
    sectionDesc: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xxs,
      color: theme.colors.text,
    },
    list: {
      flexDirection: "column",
      marginVertical: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    button: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
  });
