import { AppBar, Form, MainBody } from "@components";
import { useState } from "react";
import { ScrollView } from "react-native";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "@providers/auth_provider";
import { useAppTheme } from "@providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import * as rules from "@/plugins/rules";
import { describeAuthError } from "@/app/composable/auth_errors";

/** Change the password while signed in. Other devices are signed out; this one stays in. */
export default function ChangePasswordPage() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { changePassword } = useAuth();

  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [done, setDone] = useState(false);

  async function handleChange() {
    if (!current || password.length < 8 || loading) return;
    setErrorMsg("");
    setLoading(true);
    try {
      await changePassword(current, password);
      setDone(true);
      setTimeout(() => router.back(), 1200);
    } catch (error) {
      setErrorMsg(describeAuthError(error, t, "changePassword"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("auth.changePassword")} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, rowGap: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
        <Form
          fields={[
            { value: current, onChange: setCurrent, validator: rules.required, label: t("auth.currentPassword"), secure: true, autoComplete: "password" },
            { value: password, onChange: setPassword, validator: [rules.required, rules.password], label: t("auth.newPassword"), secure: true, autoComplete: "new-password" },
          ]}
        />
        <Button mode="contained" onPress={handleChange} loading={loading} disabled={loading || done || !current || password.length < 8} style={{ borderRadius: 4, minHeight: 48 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.textOnPrimary, fontWeight: "bold" }}>
            {t("auth.changePassword")}
          </Text>
        </Button>
        {!!errorMsg && <Text style={{ color: theme.colors.error }}>{errorMsg}</Text>}
        {done && <Text style={{ color: theme.colors.text }}>{t("auth.passwordChanged")}</Text>}
      </ScrollView>
    </MainBody>
  );
}
