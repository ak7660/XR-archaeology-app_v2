import { AppBar, Carousel, ContentItem, ErrorPage, IconBtn, LoadingPage, MainBody, NAVBAR_HEIGHT } from "@/components";
import { BookmarkOutlineIcon } from "@components/icons";
import { useFeathers } from "@providers/feathers_provider";
import { useLanguage } from "@/providers/language_provider";
import { AppTheme, useAppTheme } from "@providers/style_provider";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Text } from "react-native-paper";
import { ExperienceItem } from "@/models/experience";

export default function Page() {
  const feathers = useFeathers();
  const { theme } = useAppTheme();
  const { getLocalizedText } = useLanguage();
  const { width: screenWidth } = useWindowDimensions();
  const style = useStyle({ theme, screenWidth });
  /**
   * @property {string} id refers to the _id of model
   * @property {string} service refers to the feathers api service's name
   */
  const { id, service = "experience" } = useLocalSearchParams<{ id?: string; service?: string }>();
  const [loaded, setLoaded] = useState(false);
  const [item, setItem] = useState<ExperienceItem>();

  useEffect(() => {
    async function init() {
      if (!service || !id) {
        setLoaded(true);
        return;
      }
      try {
        const res = await feathers.service(service).get(id);
        setItem(res);
      } finally {
        setLoaded(true);
      }
    }
    init();
  }, []);

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar
        showBack
        title={getLocalizedText(item?.name) ?? "WorkShop"}
        actions={[{ icon: (props) => <BookmarkOutlineIcon fill={props.color} size={props.size} /> }]}
      />
      {!loaded ? (
        <LoadingPage />
      ) : item ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.md }}>
          {item.images && <Carousel images={item.images} />}

          <View style={style.topSection}>
            <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
              {getLocalizedText(item.name)}
            </Text>
            {item.language || item.duration ? (
              <Text style={{ color: theme.colors.primary }}>
                {item.language ? `Language: ${item.language}, ` : ""} {item.duration ? `Duration: ${item.duration}` : ""}
              </Text>
            ) : null}
            {item.desc ? (
              <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                {getLocalizedText(item.desc)}
              </Text>
            ) : (
              item.briefDesc && (
                <Text variant="bodyMedium" style={{ color: theme.colors.text }}>
                  {getLocalizedText(item.briefDesc)}
                </Text>
              )
            )}
            {item.address ? (
              <Pressable onPress={() => Linking.openURL(item.addressLink)}>
                <View style={style.iconBarText}>
                  <IconBtn key={"map"} icon="location" iconProps={{ fill: theme.colors.primary }} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                    {`Position: ${item.address}`}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {item.personalLink ? (
              <Pressable onPress={() => Linking.openURL(item.personalLink)}>
                <View style={style.iconBarText}>
                  <IconBtn key={"home"} icon="home" iconProps={{ fill: theme.colors.primary }} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                    {`Social Account: ${item.contactText}`}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {item.phone ? (
              <Pressable onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                <View style={style.iconBarText}>
                  <IconBtn key={"home"} icon="help" iconProps={{ fill: theme.colors.primary }} />
                  <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                    {`Contact: ${item.phone}`}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </View>
          {item.content && (
            <View style={{ flexDirection: "column", rowGap: 1.5 * theme.spacing.xl }}>
              {item.content.map((item, index) => (
                <ContentItem content={item} key={index} imageStyle={{ marginHorizontal: theme.spacing.lg, borderRadius: theme.spacing.xs }} />
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ErrorPage message="Details for this item aren't available" />
      )}
    </MainBody>
  );
}

const useStyle = ({ theme, screenWidth }: { theme: AppTheme; screenWidth: number }) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignContent: "center" },
    topSection: {
      flexDirection: "column",
      paddingHorizontal: theme.spacing.lg,
      rowGap: theme.spacing.sm,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    image: { resizeMode: "cover" },
    thumbnail: {
      width: screenWidth,
      height: (screenWidth * 9) / 16,
    },
    map: {
      width: screenWidth,
      height: (screenWidth * 9) / 32,
    },
    iconBarText: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
    },
  });
