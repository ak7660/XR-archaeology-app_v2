import { Routes } from "@/app/composable/routes";
import { ExperienceItem } from "@/models/experience";
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
  const [items, setItems] = useState<ExperienceItem[]>([]);
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
    let filtered = items.slice();
    
    if (search_text.length) {
      filtered = filtered.filter((item) => {
        const itemName = item.name[language] ?? item.name.en;
        return itemName.toLowerCase().includes(search_text);
      });
    }

    if (isSorted && userLocation) {
      filtered.sort((a, b) => {
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    return filtered;
  }, [search, items, language, isSorted, userLocation]);

  async function syncData() {
    const query = { $skip: cursor.current, $sort: "order" };
    const res: Paginated<ExperienceItem> = await feathers.service("experience").find({
      query: query,
    });
    if (res.total != total.current) total.current = res.total;
    let count: number = res.data.length;

    setItems((items) => [...items, ...res.data]);
    cursor.current += count;
  }

  async function onScroll({ nativeEvent }) {
    setScrolled(true);
  }

  async function loadMore() {
    if (!hasScrolled) return null;
    if (items.length >= total.current) return;
    setLoading(true);
    try {
      await syncData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("home.greatWorkshop")} showBack />
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
          const props: ListItemProps = {
            name: getLocalizedText(item.name),
            briefDesc: getLocalizedText(item.briefDesc),
            images: item.images,
            href: {
              pathname: Routes.ExperienceDetail,
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
                Armenia has many cultural handicraft. Join workshop to experience!
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
