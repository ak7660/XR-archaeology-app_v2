import { AppBar, Form, MainBody } from "@components";
import { useState } from "react";
import { ScrollView } from "react-native";
import { Button, Text } from "react-native-paper";
import { router } from "expo-router";
import { useAuth } from "@providers/auth_provider";
import { useAppTheme } from "@providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import * as rules from "@/plugins/rules";
import { describeAuthError, fill } from "../composable/auth_errors";

/** Two steps on one screen: ask for a code by email, then set a new password with it. */
export default function ForgotPasswordPage() {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  const { forgotPassword, resetPassword } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSend() {
    if (rules.email(email.trim()) || loading) return;
    setErrorMsg("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("code");
    } catch (error) {
      setErrorMsg(describeAuthError(error, t));
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (code.length !== 6 || password.length < 8 || loading) return;
    setErrorMsg("");
    setLoading(true);
    try {
      await resetPassword(email, code, password);
      router.replace("/");
    } catch (error) {
      setErrorMsg(describeAuthError(error, t, "code"));
    } finally {
      setLoading(false);
    }
  }

  const buttonStyle = { borderRadius: 4, minHeight: 48 };
  const labelStyle = { color: theme.colors.textOnPrimary, fontWeight: "bold" as const };

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("auth.resetTitle")} showBack />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, rowGap: theme.spacing.lg }} keyboardShouldPersistTaps="handled">
        {step === "email" ? (
          <>
            <Text variant="bodyLarge" style={{ color: theme.colors.text }}>
              {t("auth.resetIntro")}
            </Text>
            <Form
              fields={[
                {
                  value: email,
                  onChange: setEmail,
                  validator: [rules.required, rules.email],
                  label: t("auth.email"),
                  keyboardType: "email-address",
                  autoCapitalize: "none",
                  autoComplete: "email",
                },
              ]}
            />
            <Button mode="contained" onPress={handleSend} loading={loading} disabled={loading} style={buttonStyle}>
              <Text variant="labelLarge" style={labelStyle}>
                {t("auth.sendCode")}
              </Text>
            </Button>
          </>
        ) : (
          <>
            <Text variant="bodyLarge" style={{ color: theme.colors.text }}>
              {fill(t("auth.codeSentTo"), { email: email.trim() })}
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
                {
                  value: password,
                  onChange: setPassword,
                  validator: [rules.required, rules.password],
                  label: t("auth.newPassword"),
                  secure: true,
                  autoComplete: "new-password",
                },
              ]}
            />
            <Button mode="contained" onPress={handleReset} loading={loading} disabled={loading || code.length !== 6 || password.length < 8} style={buttonStyle}>
              <Text variant="labelLarge" style={labelStyle}>
                {t("auth.setNewPassword")}
              </Text>
            </Button>
            <Button mode="text" onPress={handleSend} disabled={loading}>
              {t("auth.resendCode")}
            </Button>
          </>
        )}
        {!!errorMsg && <Text style={{ color: theme.colors.error }}>{errorMsg}</Text>}
      </ScrollView>
    </MainBody>
  );
}
