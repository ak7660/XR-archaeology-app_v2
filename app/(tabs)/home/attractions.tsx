import { AppBar, MainBody, ListItem, ListItemProps, NAVBAR_HEIGHT } from "@/components";
import { SearchInput } from "@/components/common/search";
import { Attraction, AttractionType } from "@/models";
import { useFeathers, Paginated } from "@/providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { useAppTheme } from "@/providers/style_provider";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

const mappingDesc: Record<AttractionType, { title: string; desc?: string }> = {
  Attraction: {
    title: "Attractions",
    desc: "Vedi is know for its rich history, culture and tradition",
  },
  Restaurant: {
    title: "Culinary Delights",
    desc: "Armenian cuisine is known for its rich flavours and unique combinations of ingredients",
  },
  Lodging: {
    title: "Lodging",
  },
  Other: {
    title: "Others",
  },
};

export default function Page() {
  const feathers = useFeathers();
  const { theme } = useAppTheme();
  const { language, getLocalizedText } = useLanguage();
  /**
   * @property {string} id refers to the _id of model
   * @property {string} service refers to the feathers api service's name
   */
  const { type = "Attraction" } = useLocalSearchParams<{ type?: AttractionType }>();

  const [attractions, setAttractions] = useState<Attraction[]>([]);
  /** initial loading */
  const [loaded, setLoaded] = useState(false);
  /** scroll to load more */
  const [loading, setLoading] = useState(false);
  const [hasScrolled, setScrolled] = useState(false);
  const [search, setSearchText] = useState("");
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
    if (!search_text.length) {
      return attractions.slice();
    }
    return attractions.filter((attraction) => {
      const attractionName = attraction.name[language] ?? attraction.name.en;
      return attractionName.toLowerCase().includes(search_text);
    });
  }, [search, attractions, language]);

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
        {/* <Text variant="bodyMedium" style={{ color: theme.colors.grey2 }}>
          {mappingDesc[type].desc}
        </Text> */}
        <SearchInput onChangeText={(val) => setSearchText(val)}></SearchInput>
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
      <AppBar title={mappingDesc[type].title} showBack />
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