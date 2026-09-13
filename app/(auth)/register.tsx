import { AppBar, Form, MainBody } from "@components";
import _ from "lodash";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useAuth } from "@providers/auth_provider";
import { useAppTheme, AppTheme } from "@providers/style_provider";
import { useTranslation } from "@/hooks/useTranslation";
import * as rules from "@/plugins/rules";
import { router } from "expo-router";
import { Routes } from "../composable/routes";
import { PRIVACY_POLICY_URL } from "../composable/links";
import { describeAuthError } from "../composable/auth_errors";

/** Sign up with the essentials only; phone and the rest can be added in Profile.
 * Favourites saved as a guest come along into the new account. */
export default function RegisterPage() {
  const { theme } = useAppTheme();
  const style = useStyle({ theme });
  const { t } = useTranslation();
  const { register, login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [formValid, setFormValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const complete = !!firstName.trim() && !rules.email(email.trim()) && password.length >= 8;

  const handleRegister = async () => {
    if (!formValid || !complete || loading) return;
    setErrorMsg("");
    setLoading(true);
    try {
      await register({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() || undefined });
      await login({ email, password });
      router.replace(Routes.VerifyEmail);
    } catch (error) {
      setErrorMsg(describeAuthError(error, t, "signup"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar title={t("auth.signup")} showBack={true} />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: 120, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <Form
          setValid={setFormValid}
          fields={[
            { value: firstName, onChange: setFirstName, validator: rules.required, label: t("auth.firstNameRequired"), autoComplete: "given-name" },
            { value: lastName, onChange: setLastName, label: t("auth.lastNameOptional"), autoComplete: "family-name" },
            {
              value: email,
              onChange: setEmail,
              validator: [rules.required, rules.email],
              label: t("auth.emailRequired"),
              keyboardType: "email-address",
              autoCapitalize: "none",
              autoComplete: "email",
            },
            {
              value: password,
              onChange: setPassword,
              validator: [rules.required, rules.password],
              label: t("auth.passwordHint"),
              secure: true,
              autoComplete: "new-password",
            },
          ]}
        />
        <View style={{ height: theme.spacing.lg }} />
        <Text variant="bodySmall" style={{ color: theme.colors.grey2 }}>
          {t("auth.privacyNotice")}
        </Text>
        <Button mode="text" compact style={{ alignSelf: "flex-start" }} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
          {t("auth.privacyLink")}
        </Button>
        {!!errorMsg && <Text style={{ color: theme.colors.error, marginTop: theme.spacing.sm }}>{errorMsg}</Text>}
      </ScrollView>
      <View style={style.footer}>
        <Button
          mode="contained"
          buttonColor={theme.colors.primary}
          onPress={handleRegister}
          style={style.largeButton}
          disabled={loading || !complete}
          loading={loading}
        >
          <Text variant="labelLarge" style={{ color: theme.colors.textOnPrimary, fontWeight: "bold" }}>
            {t("auth.signup")}
          </Text>
        </Button>
      </View>
    </MainBody>
  );
}

const useStyle = ({ theme }: { theme: AppTheme }) =>
  StyleSheet.create({
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background.concat("80"),
      padding: theme.spacing.lg,
    },
    largeButton: {
      borderRadius: 4,
      minHeight: 48,
    },
  });
