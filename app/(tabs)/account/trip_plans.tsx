import { AppBar, MainBody, NAVBAR_HEIGHT } from "@/components";
import { useAuth } from "@/providers/auth_provider";
import { useFeathers } from "@/providers/feathers_provider";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { Routes } from "@/app/composable/routes";
import { fill } from "@/app/composable/auth_errors";
import { planSummary, planReady, SavedPlan } from "@/app/composable/trip_plans";
import { router, useFocusEffect } from "expo-router";
import moment from "moment";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";

/** Trip-planner conversations saved while signed in. Tapping one reopens it in the planner. */
export default function TripPlansPage() {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const { t } = useTranslation();
  const feathers = useFeathers();
  const { user } = useAuth();
  const signedIn = !!user?._id;

  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!signedIn) return setLoading(false);
    try {
      const res = await feathers.service("plannerConversations").find({
        query: { $sort: { updatedAt: -1 }, $limit: 50, $select: ["_id", "title", "stage", "tripData", "updatedAt", "createdAt"] },
      });
      setPlans(Array.isArray(res) ? res : res.data);
    } catch (error) {
      console.warn("trip plans", error);
    } finally {
      setLoading(false);
    }
  }, [feathers, signedIn]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmDelete(plan: SavedPlan) {
    Alert.alert(t("tripPlans.deleteTitle"), t("tripPlans.deleteMessage"), [
      { text: t("tripPlans.cancel"), style: "cancel" },
      {
        text: t("tripPlans.delete"),
        style: "destructive",
        onPress: async () => {
          setPlans((list) => list.filter((p) => p._id !== plan._id));
          try {
            await feathers.service("plannerConversations").remove(plan._id);
          } catch (error) {
            console.warn("delete plan", error);
            load();
          }
        },
      },
    ]);
  }

  if (!signedIn) {
    return (
      <MainBody padding={{ top: 0 }}>
        <AppBar title={t("tripPlans.title")} showBack />
        <View style={style.empty}>
          <Text variant="bodyLarge" style={{ color: theme.colors.text, textAlign: "center" }}>
            {t("tripPlans.signInToSee")}
          </Text>
          <Button mode="contained" onPress={() => router.push(Routes.Login)} textColor={theme.colors.textOnPrimary}>
            {t("tripPlans.signIn")}
          </Button>
        </View>
      </MainBody>
    );
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("tripPlans.title")} showBack />
      <FlatList
        data={plans}
        keyExtractor={(p) => p._id}
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: NAVBAR_HEIGHT + theme.spacing.xl, rowGap: theme.spacing.sm, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => {
          const ready = planReady(item.stage);
          return (
            <Pressable
              style={style.row}
              onPress={() => router.push({ pathname: Routes.TripPlanner, params: { plan: item._id } })}
              accessibilityRole="button"
            >
              <View style={{ flex: 1, rowGap: 2 }}>
                <Text variant="labelLarge" style={{ color: theme.colors.text }} numberOfLines={2}>
                  {item.title || t("tripPlans.untitled")}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
                  {planSummary(item, t)}
                </Text>
                <Text variant="bodySmall">
                  <Text variant="bodySmall" style={{ color: ready ? theme.colors.secondary : theme.colors.grey2, fontWeight: ready ? "700" : "400" }}>
                    {ready ? t("tripPlans.planReady") : t("tripPlans.inProgress")}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
                    {"   "}
                    {fill(t("tripPlans.updated"), { when: moment(item.updatedAt || item.createdAt).fromNow() })}
                  </Text>
                </Text>
              </View>
              <IconButton icon="delete-outline" iconColor={theme.colors.grey2} onPress={() => confirmDelete(item)} accessibilityLabel={t("tripPlans.delete")} />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? null : (
            <View style={style.empty}>
              <Text variant="bodyLarge" style={{ color: theme.colors.text, textAlign: "center" }}>
                {t("tripPlans.empty")}
              </Text>
              <Button mode="contained" onPress={() => router.push(Routes.TripPlanner)} textColor={theme.colors.textOnPrimary}>
                {t("tripPlans.planTrip")}
              </Button>
            </View>
          )
        }
      />
    </MainBody>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
      paddingLeft: theme.spacing.md,
      paddingRight: theme.spacing.xxs,
      backgroundColor: theme.colors.container,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.grey4,
    },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", rowGap: theme.spacing.md, paddingHorizontal: theme.spacing.lg },
  });
