import { Routes } from "@/app/composable/routes";
import { AppBar, ListItem, ListItemProps, MainBody, NAVBAR_HEIGHT } from "@/components";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { Paginated, useFeathers } from "@/providers/feathers_provider";
import { ArReconstruction } from "@/models";
import _ from "lodash";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { WALL_INFOS } from "./fixed-things/ar";
import { getThumb } from "@/plugins/utils";

export default function Page() {
  const { theme } = useAppTheme();
  const style = useStyle({ theme });
  const feathers = useFeathers();
  const [items, setItems] = useState<ListItemProps[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res: Paginated<ArReconstruction> = await feathers
          .service("arReconstructions")
          .find({ query: { $sort: { order: 1 } } });

        if (res.data && res.data.length > 0) {
          setItems(
            res.data.map((ar) => ({
              name: ar.name,
              briefDesc: ar.briefDesc,
              images: ar.images?.length ? ar.images : undefined,
              href: { pathname: Routes.ArTest, params: { id: ar._id } },
            }))
          );
        } else {
          // Fallback to hardcoded data
          setItems(
            WALL_INFOS.map((point) => ({
              name: point.name,
              briefDesc: point.briefDesc,
              images: point.images as any,
              href: { pathname: Routes.ArTest, params: { id: point.id } },
            }))
          );
        }
      } catch (err) {
        console.warn("[AR Entry] Failed to fetch arReconstructions, using hardcoded:", err?.message || err);
        setItems(
          WALL_INFOS.map((point) => ({
            name: point.name,
            briefDesc: point.briefDesc,
            images: point.images as any,
            href: { pathname: Routes.ArTest, params: { id: point.id } },
          }))
        );
      } finally {
        setLoaded(true);
      }
    }
    fetchData();
  }, []);

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title="Virtual reconstruction" showBack />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: NAVBAR_HEIGHT + theme.spacing.md }}>
        <View style={style.sectionHeader}></View>
        <Text variant="bodyMedium" style={style.sectionDesc}>
          another description
        </Text>
        {!loaded ? (
          <View style={{ paddingVertical: theme.spacing.xl, alignItems: "center" }}>
            <ActivityIndicator size="small" />
          </View>
        ) : (
          <View style={style.list}>
            {items.map((item, index) => {
              return <ListItem {...item} key={index} />;
            })}
          </View>
        )}
      </ScrollView>
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
  });
