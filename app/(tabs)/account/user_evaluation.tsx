import { AppBar, MainBody } from "@/components";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppTheme } from "@/providers/style_provider";
import { View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { WebView } from "react-native-webview";

const TALLY_FORM_URL = "https://tally.so/r/rjLWgN";

export default function UserEvaluationPage() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("profile.userEvaluation")} showBack={true} />
      <View style={{ flex: 1, padding: theme.spacing.md }}>
        <WebView
          source={{ uri: TALLY_FORM_URL }}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator animating={true} />
            </View>
          )}
          style={{ flex: 1, borderRadius: theme.borderRadius.sm, overflow: "hidden" }}
        />
      </View>
    </MainBody>
  );
}
