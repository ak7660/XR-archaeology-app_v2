import { AppBar, ListItem, MainBody, NAVBAR_HEIGHT } from "@/components";
import { BookmarkIcon, BoxIcon } from "@/components/icons";
import { Artifact, Attraction } from "@/models";
import { useAuth } from "@/providers/auth_provider";
import { useFeathers } from "@/providers/feathers_provider";
import { useLocalizedText } from "@/hooks/useLocalizedText";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { useBookmarks, useCollection } from "@/hooks/useBookmarks";
import { router, useFocusEffect } from "expo-router";
import _ from "lodash";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";

/** Everything the person saved: places they bookmarked, and 3D models they kept
 * from augmented reality. Reached from Account > Favourites. */
export default function FavouritesPage() {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const { t } = useTranslation();
  const localize = useLocalizedText();
  const feathers = useFeathers();
  const { user } = useAuth();
  const bookmarks = useBookmarks();
  const collection = useCollection();

  const [places, setPlaces] = useState<Attraction[]>([]);
  const [models, setModels] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  /** Fetches saved records in chunks; ids the server no longer knows just drop out. */
  const fetchByIds = useCallback(
    async (service: string, ids: string[]) => {
      if (!ids.length) return [];
      const pages = await Promise.all(
        _.chunk(ids, 20).map((chunk) => feathers.service(service).find({ query: { _id: { $in: chunk }, $limit: 100 } })),
      );
      const found = _.flatten(pages.map((page: any) => (Array.isArray(page) ? page : page.data)));
      // Keep the order they were saved in, newest last.
      return _.compact(ids.map((id) => found.find((item: any) => String(item._id) === id)));
    },
    [feathers],
  );

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const [savedPlaces, savedModels] = await Promise.all([fetchByIds("attractions", bookmarks.ids), fetchByIds("artifacts", collection.ids)]);
      setPlaces(savedPlaces as Attraction[]);
      setModels(savedModels as Artifact[]);
    } catch (error) {
      console.warn("favourites", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [fetchByIds, bookmarks.ids.join(","), collection.ids.join(",")]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function removePlace(id: string) {
    setPlaces((list) => list.filter((p) => String(p._id) !== id));
    await bookmarks.remove(id);
  }

  async function removeModel(id: string) {
    setModels((list) => list.filter((m) => String(m._id) !== id));
    await collection.remove(id);
  }

  const empty = !places.length && !models.length;

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("favourites.title")} showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: NAVBAR_HEIGHT + theme.spacing.xl, rowGap: theme.spacing.sm, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {empty ? (
          loading ? null : (
            <View style={style.empty}>
              <BookmarkIcon fill={theme.colors.grey3} size={48} />
              <Text variant="bodyLarge" style={{ color: theme.colors.text, textAlign: "center" }}>
                {failed ? t("favourites.loadFailed") : t("favourites.empty")}
              </Text>
              {!failed && (
                <Button mode="contained" textColor={theme.colors.textOnPrimary} onPress={() => router.push("/home/attractions")}>
                  {t("favourites.browse")}
                </Button>
              )}
            </View>
          )
        ) : (
          <>
            {!user?._id && (
              <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
                {t("favourites.guestNote")}
              </Text>
            )}

            {!!places.length && (
              <>
                <Text variant="titleSmall" style={style.sectionHeader}>
                  {t("favourites.places")}
                </Text>
                {places.map((place) => (
                  <View key={String(place._id)} style={style.placeRow}>
                    <ListItem
                      id={String(place._id)}
                      name={place.name}
                      briefDesc={place.briefDesc}
                      images={place.thumbnails}
                      latitude={place.latitude}
                      longitude={place.longitude}
                      href={{ pathname: "/home/detail", params: { id: String(place._id), service: "attractions" } }}
                      actions={[
                        <IconButton
                          key="remove"
                          icon={() => <BookmarkIcon fill={theme.colors.primary} size={24} />}
                          accessibilityLabel={t("favourites.remove")}
                          onPress={() => removePlace(String(place._id))}
                        />,
                      ]}
                    />
                  </View>
                ))}
              </>
            )}

            {!!models.length && (
              <>
                <Text variant="titleSmall" style={style.sectionHeader}>
                  {t("favourites.models")}
                </Text>
                {models.map((model) => (
                  <View key={String(model._id)} style={style.modelRow}>
                    <BoxIcon fill={theme.colors.grey2} size={24} />
                    <Text variant="labelLarge" style={{ color: theme.colors.text, flex: 1 }} numberOfLines={2}>
                      {typeof model.name === "string" ? model.name : localize(model.name as any)}
                    </Text>
                    <IconButton
                      icon={() => <BookmarkIcon fill={theme.colors.primary} size={24} />}
                      accessibilityLabel={t("favourites.remove")}
                      onPress={() => removeModel(String(model._id))}
                    />
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </MainBody>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    sectionHeader: { color: theme.colors.grey2, marginTop: theme.spacing.sm },
    placeRow: { borderRadius: theme.borderRadius.sm, overflow: "hidden" },
    modelRow: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
      paddingRight: theme.spacing.xxs,
      paddingVertical: theme.spacing.xs,
      backgroundColor: theme.colors.container,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.grey4,
    },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", rowGap: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
  });
