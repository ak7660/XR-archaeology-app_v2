import { Routes } from "@/app/composable/routes";
import { Location, Route } from "@/models";
import { Paginated, useFeathers } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { AppBar, ListItem, ListItemProps, MainBody, NAVBAR_HEIGHT } from "@components";
import { SearchInput } from "@/components/common/search";

import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useNearby } from "@/hooks/useNearby";
import NearbySortButton from "@/components/common/nearby_sort";
import { distanceKm, formatDistance } from "@/app/composable/nearby";

export default function Page() {
  const feathers = useFeathers();
  const { theme } = useAppTheme();
  const { getLocalizedText, language } = useLanguage();
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<Route[]>([]);
  /** initial loading */
  const [loaded, setLoaded] = useState(false);
  /** scroll to load more */
  const [loading, setLoading] = useState(false);
  const [hasScrolled, setScrolled] = useState(false);
  const [search, setSearchText] = useState("");
  const nearby = useNearby();
  /** Where each walk begins: a route carries no coordinates of its own, so its
   * first location stands in - for the distance, and for the Navigate button,
   * which until now read a `points` field that routes never had. */
  const [startPoints, setStartPoints] = useState<Record<string, Location>>({});
  const cursor = useRef(0);
  const total = useRef(0);

  useEffect(() => {
    async function init() {
      setLoaded(false);
      try {
        await syncData();
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, []);

  const searched_list = useMemo(() => {
    const search_text = search.trim().toLowerCase();
    let filtered = routes.slice();

    if (search_text.length) {
      filtered = filtered.filter((route) => {
        const routeName = route.name[language] ?? route.name.en;
        return routeName.toLowerCase().includes(search_text);
      });
    }

    // A walk is as far away as the place it starts from.
    return nearby.sort(filtered, (route) => startPoints[route._id]);
  }, [search, routes, language, startPoints, nearby.enabled, nearby.position]);

  async function syncData() {
    const query = { $skip: cursor.current, $sort: "order" };
    const res: Paginated<Route> = await feathers.service("routes").find({
      query: query,
    });
    if (res.total != total.current) total.current = res.total;
    let count: number = res.data.length;

    setRoutes((items) => [...items, ...res.data]);
    cursor.current += count;
    await syncStartPoints(res.data.map((route) => route._id));
  }

  /** First location of each walk, in one request. */
  async function syncStartPoints(routeIds: string[]) {
    if (!routeIds.length) return;
    try {
      const res: Paginated<Location> = await feathers.service("locations").find({
        query: { route: { $in: routeIds }, $sort: { order: 1 }, $limit: 200, $select: ["_id", "route", "latitude", "longitude"] },
      });
      const list = Array.isArray(res) ? res : res.data;
      setStartPoints((current) => {
        const next = { ...current };
        for (const location of list) {
          const routeId = String((location as any).route);
          if (!next[routeId]) next[routeId] = location;
        }
        return next;
      });
    } catch (error) {
      console.warn("hiking: could not load where the walks start", error);
    }
  }

  async function onScroll({ nativeEvent }) {
    setScrolled(true);
  }

  async function loadMore() {
    if (!hasScrolled) return null;
    if (routes.length >= total.current) return;
    setLoading(true);
    try {
      await syncData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("home.greatOutdoors")} showBack />
      <FlatList
        onScroll={onScroll}
        onEndReached={loadMore}
        scrollEventThrottle={400}
        data={searched_list}
        keyExtractor={(item) => item._id}
        ItemSeparatorComponent={() => <View style={{ height: theme.spacing.xs }} />}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.lg }}
        contentInset={{ bottom: theme.spacing.lg }}
        renderItem={({ item }) => {
          const start = startPoints[item._id];

          const props: ListItemProps = {
            name: getLocalizedText(item.name),
            briefDesc: getLocalizedText(item.briefDesc),
            images: item.thumbnails,
            showNavigate: true,
            latitude: start?.latitude,
            longitude: start?.longitude,
            distance: formatDistance(distanceKm(nearby.position, start)),
            href: {
              pathname: Routes.Route,
              params: { id: item._id },
            },
          };
          return <ListItem {...props} />;
        }}
        ListHeaderComponent={() => {
          return (
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingBottom: theme.spacing.lg,
                paddingTop: theme.spacing.md,
              }}
            >
              <Text variant="bodyMedium" style={{ color: theme.colors.grey2, marginBottom: theme.spacing.md }}>
                Armenia is a moutainous country, you can enjoy a heritage and scenic hike.
              </Text>
              <View style={{ rowGap: theme.spacing.sm }}>
                <SearchInput onChangeText={(val) => setSearchText(val)}></SearchInput>
                <NearbySortButton status={nearby.status} onPress={nearby.toggle} />
              </View>
            </View>
          );
        }}
        ListFooterComponent={() => {
          if (loading) {
            return (
              <View style={{ height: 32, display: "flex", alignContent: "center", justifyContent: "center", marginVertical: theme.spacing.md }}>
                <ActivityIndicator animating size={"small"} />
              </View>
            );
          }
        }}
      />
    </MainBody>
  );
}
