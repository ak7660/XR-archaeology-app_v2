import { AppBar, MainBody, ListItem, ListItemProps, NAVBAR_HEIGHT } from "@/components";
import { SearchInput } from "@/components/common/search";
import { SortIcon } from "@/components/icons";
import { Attraction, AttractionType } from "@/models";
import { useFeathers, Paginated } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistance } from "@/plugins/utils";

export default function Page() {
  const feathers = useFeathers();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { language, getLocalizedText } = useLanguage();
  /**
   * @property {string} id refers to the _id of model
   * @property {string} service refers to the feathers api service's name
   */
  const { type = "Attraction" } = useLocalSearchParams<{ type?: AttractionType }>();

  // Get translated title based on attraction type
  const getTitle = (attractionType: AttractionType): string => {
    switch (attractionType) {
      case "Attraction":
        return t("home.attractions");
      case "Restaurant":
        return t("home.culinaryDelights");
      case "Lodging":
        return t("home.lodgings");
      case "Other":
        return t("common.others");
      default:
        return t("home.attractions");
    }
  };

  const [attractions, setAttractions] = useState<Attraction[]>([]);
  /** initial loading */
  const [loaded, setLoaded] = useState(false);
  /** scroll to load more */
  const [loading, setLoading] = useState(false);
  const [hasScrolled, setScrolled] = useState(false);
  const [search, setSearchText] = useState("");
  const [isSorted, setIsSorted] = useState(false);
  const { location: userLocation } = useLocation();
  const cursor = useRef(0);
  const total = useRef(Infinity);

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
    let filtered = attractions.slice();
    
    if (search_text.length) {
      filtered = filtered.filter((attraction) => {
        const attractionName = attraction.name[language] ?? attraction.name.en;
        return attractionName.toLowerCase().includes(search_text);
      });
    }

    if (isSorted && userLocation) {
      filtered.sort((a, b) => {
        // Log individual item coordinates to debug
        // console.log(`Sorting: ${a.name.en} (${a.latitude}, ${a.longitude}) vs ${b.name.en} (${b.latitude}, ${b.longitude})`);
        
        if (!a.latitude || !a.longitude) return 1;
        if (!b.latitude || !b.longitude) return -1;
        
        const distA = calculateDistance(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude);
        const distB = calculateDistance(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude);
        
        // If distances are very similar, ensure order is consistent
        if (Math.abs(distA - distB) < 0.0001) return 0;
        
        return distA - distB;
      });
    }

    return filtered;
  }, [search, attractions, language, isSorted, userLocation]);

  async function syncData() {
    if (cursor.current != 0 && cursor.current >= total.current) return;
    while (cursor.current < total.current) {
      const query = { $skip: cursor.current, $sort: { order: 1 }, type: type, $populate: ["tags"] };
      const res: Paginated<Attraction> = await feathers.service("attractions").find({
        query: query,
      });

      if (res.total != total.current) total.current = res.total;
      let count: number = res.data.length;

      setAttractions((items) => [...items, ...res.data]);
      cursor.current += count;
    }
  }

  const header = (() => {
    return (
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg, paddingTop: theme.spacing.md }}>
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
  })();

  async function onScroll({ nativeEvent }) {
    setScrolled(true);
  }

  async function loadMore() {
    if (!hasScrolled) return null;
    if (attractions.length >= total.current || loading) return;
    setLoading(true);
    try {
      await syncData();
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={getTitle(type)} showBack />
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
          let brief = getLocalizedText(item.briefDesc);

          if (brief && item.contact) brief += `\nContact no.: ${item.contact}`;
          const props: ListItemProps = {
            id: item._id,
            name: item.name,
            briefDesc: brief,
            images: item.thumbnails,
            showNavigate: true,
            latitude: item.latitude,
            longitude: item.longitude,
            tags: item.tags,
            href: {
              pathname: "/home/detail",
              params: { id: item._id, service: "attractions" },
            },
          };
          return <ListItem {...props} />;
        }}
        ListHeaderComponent={header}
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