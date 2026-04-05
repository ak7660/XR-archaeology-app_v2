import { Routes } from "@/app/composable/routes";
import { AppBar, MainBody } from "@/components";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppTheme } from "@/providers/style_provider";
import { router } from "expo-router";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";

export default function HelpFeedbackPage() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("profile.helpAndFeedback")} showBack={true} />
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text variant="bodyLarge">
          {t("profile.helpFeedbackDescription")}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push(Routes.UserEvaluation)}
        >
          {t("profile.userEvaluation")}
        </Button>
      </View>
    </MainBody>
  );
}
