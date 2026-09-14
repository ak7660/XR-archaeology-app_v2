import { useAuth } from "@providers/auth_provider";
import { LanguageEnum, useLanguage } from "@providers/language_provider";
import { AppTheme, useAppTheme } from "@providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { Routes } from "../composable/routes";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LANGUAGES: { code: LanguageEnum; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hy", label: "ՀՅ" },
  { code: "ru", label: "RU" },
];

/**
 * The first screen for anyone who isn't signed in: create an account, sign in,
 * or continue as a guest. Guests can do everything except book events and save
 * trip plans. The choice is remembered (auth_provider `guestChosen`); signing out
 * brings this screen back on the next launch. The welcome survey waits until
 * a choice is made.
 */
export default function WelcomePage() {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { continueAsGuest } = useAuth();
  const { top, bottom } = useSafeAreaInsets();

  async function asGuest() {
    await continueAsGuest();
    router.replace(Routes.Home);
  }

  return (
    <View style={style.page}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <ImageBackground source={require("@assets/images/vedi.jpg")} style={style.hero} resizeMode="cover">
          <View style={[style.languages, { top: top + theme.spacing.sm }]}>
            {LANGUAGES.map((l) => {
              const active = l.code === language;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => setLanguage(l.code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[style.langChip, active && style.langChipActive]}
                >
                  <Text variant="labelMedium" style={{ color: active ? theme.colors.text : "#FFFFFF", fontWeight: "700" }}>
                    {l.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <LinearGradient colors={["transparent", theme.colors.background]} style={style.fade} />
        </ImageBackground>

        <View style={[style.body, { paddingBottom: bottom + theme.spacing.lg }]}>
          <Text variant="headlineLarge" style={style.title}>
            Veditourism
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.grey2 }}>
            {t("welcome.tagline")}
          </Text>

          <View style={style.actions}>
            <Button mode="contained" onPress={() => router.push(Routes.Register)} style={style.button} contentStyle={style.buttonContent} textColor={theme.colors.textOnPrimary}>
              {t("welcome.createAccount")}
            </Button>
            <Button mode="outlined" onPress={() => router.push(Routes.Login)} style={[style.button, style.outlined]} contentStyle={style.buttonContent}>
              {t("welcome.signIn")}
            </Button>
            <Button mode="text" onPress={asGuest} contentStyle={style.buttonContent}>
              {t("welcome.guest")}
            </Button>
          </View>
          <Text variant="bodySmall" style={{ color: theme.colors.grey2, textAlign: "center" }}>
            {t("welcome.guestNote")}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: theme.colors.background },
    hero: { height: 380, justifyContent: "flex-end" },
    fade: { height: 140 },
    languages: { position: "absolute", right: theme.spacing.lg, flexDirection: "row", columnGap: theme.spacing.xs },
    langChip: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: "rgba(0,0,0,0.35)",
    },
    langChipActive: { backgroundColor: "#FFFFFF" },
    body: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
      marginTop: -theme.spacing.xl,
      rowGap: theme.spacing.sm,
    },
    title: { color: theme.colors.text, fontWeight: "700" },
    actions: { rowGap: theme.spacing.sm, marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
    button: { borderRadius: theme.borderRadius.sm },
    outlined: { borderColor: theme.colors.primary, borderWidth: 1.5 },
    buttonContent: { paddingVertical: theme.spacing.xxs },
  });
