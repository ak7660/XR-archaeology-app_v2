import { AppBar, Form, MainBody } from "@components";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "@providers/auth_provider";
import { useAppTheme } from "@providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import { describeAuthError, fill } from "../composable/auth_errors";

const RESEND_SECONDS = 60;

/** Confirm the email address with the 6-digit code sent at sign-up. Can be skipped:
 * confirming is only needed for things like booking an event. */
export default function VerifyEmailPage() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { user, verifyEmail, resendVerification } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notice, setNotice] = useState("");
  // A code was just sent at sign-up, so start with the resend button waiting.
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (user?.verified) router.replace("/");
  }, [user?.verified]);

  async function handleConfirm() {
    if (code.replace(/\s+/g, "").length !== 6 || loading) return;
    setErrorMsg("");
    setNotice("");
    setLoading(true);
    try {
      await verifyEmail(code);
    } catch (error) {
      setErrorMsg(describeAuthError(error, t, "code"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setErrorMsg("");
    try {
      await resendVerification();
      setNotice(t("auth.codeResent"));
      setCode("");
    } catch (error) {
      setErrorMsg(describeAuthError(error, t, "code"));
    } finally {
      setCooldown(RESEND_SECONDS);
    }
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("auth.verifyTitle")} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, rowGap: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
        <Text variant="bodyLarge" style={{ color: theme.colors.text }}>
          {fill(t("auth.verifyIntro"), { email: user?.email ?? "" })}
        </Text>
        <Form
          fields={[
            {
              value: code,
              onChange: (v) => setCode(v.replace(/[^0-9]/g, "")),
              label: t("auth.code"),
              keyboardType: "number-pad",
              maxLength: 6,
              autoComplete: "one-time-code",
            },
          ]}
        />
        <Button mode="contained" onPress={handleConfirm} loading={loading} disabled={loading || code.length !== 6} style={{ borderRadius: 4, minHeight: 48 }}>
          <Text variant="labelLarge" style={{ color: theme.colors.textOnPrimary, fontWeight: "bold" }}>
            {t("auth.confirm")}
          </Text>
        </Button>
        {!!errorMsg && <Text style={{ color: theme.colors.error }}>{errorMsg}</Text>}
        {!!notice && <Text style={{ color: theme.colors.text }}>{notice}</Text>}
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <Button mode="text" onPress={handleResend} disabled={cooldown > 0}>
            {cooldown > 0 ? fill(t("auth.resendIn"), { seconds: cooldown }) : t("auth.resendCode")}
          </Button>
          <Button mode="text" onPress={() => router.replace("/")}>
            {t("auth.later")}
          </Button>
        </View>
      </ScrollView>
    </MainBody>
  );
}
