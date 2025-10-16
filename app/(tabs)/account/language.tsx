import { MainBody } from "@/components";
import { useLanguage } from "@/providers/language_provider";
import { useAppTheme, AppTheme } from "@/providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button, Card, Text, RadioButton } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LanguageSelectionPage() {
  const { theme } = useAppTheme();
  const { top: safeTop } = useSafeAreaInsets();
  const style = useStyle({ theme, statusBarHeight: safeTop });
  const { t } = useTranslation();

  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "en" as const, name: t("language.english"), nativeName: "English" },
    { code: "hy" as const, name: t("language.armenian"), nativeName: "Հայերեն" },
    { code: "ru" as const, name: t("language.russian"), nativeName: "Русский" },
  ];

  function handleLanguageChange(languageCode: "en" | "hy" | "ru") {
    setLanguage(languageCode);
  }

  function handleSave() {
    router.back();
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <View style={[style.topSection]}>
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>
          <Text variant="headlineMedium" style={{ color: theme.colors.textOnPrimary }}>
            {t("language.title")}
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.textOnPrimary }}>
            {t("language.subtitle")}
          </Text>
        </View>
      </View>

      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Card style={style.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: theme.spacing.md }}>
              {t("language.selectLanguage")}
            </Text>
            
            {languages.map((lang) => (
              <View key={lang.code} style={style.languageOption}>
                <RadioButton
                  value={lang.code}
                  status={language === lang.code ? "checked" : "unchecked"}
                  onPress={() => handleLanguageChange(lang.code)}
                  color={theme.colors.primary}
                />
                <View style={style.languageInfo}>
                  <Text variant="bodyLarge" style={{ fontWeight: "600" }}>
                    {lang.name}
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {lang.nativeName}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>

      <View style={{ padding: theme.spacing.lg }}>
        <Button
          onPress={handleSave}
          mode="contained"
          style={style.button}
        >
          {t("language.saveChanges")}
        </Button>
      </View>
    </MainBody>
  );
}

const useStyle = ({ theme, statusBarHeight }: { theme: AppTheme; statusBarHeight: number }) =>
  StyleSheet.create({
    topSection: {
      backgroundColor: theme.colors.primary,
      borderBottomLeftRadius: theme.borderRadius.lg,
      borderBottomRightRadius: theme.borderRadius.lg,
      paddingTop: statusBarHeight,
      overflow: "hidden",
    },

    card: {
      borderRadius: theme.borderRadius.md,
    },

    languageOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: theme.spacing.sm,
    },

    languageInfo: {
      marginLeft: theme.spacing.sm,
      flex: 1,
    },

    button: {
      borderRadius: theme.borderRadius.xs,
    },
  });
