import { Routes } from "@/app/composable/routes";
import { Route } from "@/models";
import { Paginated, useFeathers } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { AppBar, ListItem, ListItemProps, MainBody, NAVBAR_HEIGHT } from "@components";
import { SearchInput } from "@/components/common/search";
import { SortIcon } from "@/components/icons";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistance } from "@/plugins/utils";

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
  const [isSorted, setIsSorted] = useState(false);
  const { location: userLocation } = useLocation();
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

    if (isSorted && userLocation) {
      filtered.sort((a, b) => {
        // Log coordinates for routes if available
        // console.log(`Sorting Route: ${a.name.en} (Points: ${a.points?.length || 0})`);
        
        // For routes, we might need to use the first point as the reference distance
        const startA = a.points && a.points.length > 0 ? a.points[0] : null;
        const startB = b.points && b.points.length > 0 ? b.points[0] : null;

        if (!startA) return 1;
        if (!startB) return -1;
        
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, startA.latitude, startA.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, startB.latitude, startB.longitude);
        return distA - distB;
      });
    }

    return filtered;
  }, [search, routes, language, isSorted, userLocation]);

  async function syncData() {
    const query = { $skip: cursor.current, $sort: "order" };
    const res: Paginated<Route> = await feathers.service("routes").find({
      query: query,
    });
    if (res.total != total.current) total.current = res.total;
    let count: number = res.data.length;

    setRoutes((items) => [...items, ...res.data]);
    cursor.current += count;
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
          // Use first point coordinates for distance-related UI (like 'Navigate')
          const routeLat = item.points && item.points.length > 0 ? item.points[0].latitude : undefined;
          const routeLon = item.points && item.points.length > 0 ? item.points[0].longitude : undefined;

          const props: ListItemProps = {
            name: getLocalizedText(item.name),
            briefDesc: getLocalizedText(item.briefDesc),
            images: item.thumbnails,
            showNavigate: true,
            latitude: routeLat,
            longitude: routeLon,
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <SearchInput onChangeText={(val) => setSearchText(val)}></SearchInput>
                </View>
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
                  <SortIcon fill={isSorted ? theme.colors.onPrimary : theme.colors.onSurface} />
                </TouchableOpacity>
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
