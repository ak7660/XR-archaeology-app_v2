import { useAppTheme, AppTheme } from "@/providers/style_provider";
import { AppBar, Form, MainBody, NAVBAR_HEIGHT } from "@components";
import { useAuth } from "@providers/auth_provider";
import { useTranslation } from "@/hooks/useTranslation";
import moment from "moment";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { Routes } from "@/app/composable/routes";
import { describeAuthError } from "@/app/composable/auth_errors";
import { Button, Text } from "react-native-paper";
import * as rules from "@/plugins/rules";
import { SuccessCircleIcon } from "@/components/icons";

export default function Page() {
  const { theme } = useAppTheme();
  const style = useStyle({ theme });
  const { t } = useTranslation();
  const { user, updateUser, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [dob, setDob] = useState(user?.dob ? moment(user.dob).format("DD/MM/YYYY") : "");


  const [areaCode, setAreaCode] = useState<number | undefined>(user?.phone ? Number(user.phone.split(" ")[0]?.substring(1)) : undefined);
  const [phone, setPhone] = useState<string>(user?.phone ? user.phone.split(" ")[1] : "");

  const [formValid, setFormValid] = useState(false);
  const [success, setSuccess] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleEdit() {
    if (editing) {
      if (!formValid || loading) return;
      setLoading(true);
      try {
        const birthday = dob.length ? moment(dob, "DD/MM/YYYY").toDate() : undefined;
        const contactNum = !!areaCode && !!phone ? `+${areaCode} ${phone}` : undefined;
        await updateUser({ firstName, lastName, username, dob: birthday, phone: contactNum });

        setSuccess(true);
        setLoading(false);
        await Promise.resolve((resolve) => setTimeout(resolve, 3000));

        setEditing(false);
      } catch (error) {
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    } else {
      setEditing(true);
      setSuccess(false);
    }
  }

  function confirmDelete() {
    Alert.alert(t("auth.deleteTitle"), t("auth.deleteMessage"), [
      { text: t("auth.cancel"), style: "cancel" },
      {
        text: t("auth.deleteConfirm"),
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteAccount();
            router.replace("/");
          } catch (error) {
            Alert.alert(t("auth.deleteAccount"), describeAuthError(error, t));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <MainBody padding={{ top: 0 }}>
      <AppBar
        title={t("profile.profile")}
        showBack
        goBack={
          !editing
            ? undefined
            : () => {
                setEditing(false);
              }
        }
      />
      <ScrollView contentContainerStyle={style.scrollView}>
        {!editing ? (
          <>
            <View style={{ rowGap: theme.spacing.lg }}>
              <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
                {t("profile.basicInformation")}
              </Text>
              <View style={style.row}>
                <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                  {t("profile.name")}
                </Text>
                <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.text, textAlign: "right" }}>
                  {user?.firstName} {user?.lastName}
                </Text>
              </View>
              <View style={style.row}>
                <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                  {t("profile.username")}
                </Text>
                <Text variant="bodyMedium" style={{ flex: 1, color: user?.username ? theme.colors.text : theme.colors.grey3, textAlign: "right" }}>
                  {user?.username ?? t("profile.notProvided")}
                </Text>
              </View>
              <View style={style.row}>
                <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                  {t("profile.birthday")}
                </Text>
                <Text variant="bodyMedium" style={{ flex: 1, color: user?.dob ? theme.colors.text : theme.colors.grey3, textAlign: "right" }}>
                  {user?.dob ? moment(user.dob).format("MM/YYYY") : t("profile.notProvided")}
                </Text>
              </View>
              <View style={[style.row, { justifyContent: "space-between" }]}>
                <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                  {t("profile.password")}
                </Text>
                <Button
                  mode="contained"
                  textColor={theme.colors.textOnPrimary}
                  style={style.button}
                  labelStyle={{ marginHorizontal: theme.spacing.sm, marginVertical: theme.spacing.xxs }}
                  onPress={() => router.push(Routes.ChangePassword)}
                >
                  {t("profile.changePassword")}
                </Button>
              </View>
            </View>
            <View style={{ rowGap: theme.spacing.lg, marginTop: theme.spacing.xl }}>
              <Text variant="headlineSmall" style={{ color: theme.colors.text }}>
                {t("profile.contact")}
              </Text>
              <View style={style.row}>
                <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                  {t("profile.email")}
                </Text>
                <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.text, textAlign: "right" }}>
                  {user?.email}
                </Text>
              </View>
              <View style={[style.row, { justifyContent: "space-between" }]}>
                <Text variant="bodySmall" style={{ color: user?.verified ? theme.colors.grey2 : theme.colors.error }}>
                  {user?.verified ? t("auth.verified") : t("auth.notVerified")}
                </Text>
                {!user?.verified && (
                  <Button mode="text" compact onPress={() => router.push(Routes.VerifyEmail)}>
                    {t("auth.confirmNow")}
                  </Button>
                )}
              </View>
              <View style={style.row}>
                <Text variant="labelMedium" style={{ color: theme.colors.text }}>
                  {t("profile.phone")}
                </Text>
                <Text variant="bodyMedium" style={{ flex: 1, color: user?.phone ? theme.colors.text : theme.colors.grey3, textAlign: "right" }}>
                  {user?.phone ?? t("profile.notProvided")}
                </Text>
              </View>
            </View>
            <Button
              mode="text"
              textColor={theme.colors.error}
              style={{ alignSelf: "flex-start", marginTop: theme.spacing.xl }}
              onPress={confirmDelete}
              loading={deleting}
              disabled={deleting}
            >
              {t("auth.deleteAccount")}
            </Button>
          </>
        ) : (
          <>
            <Form
              setValid={setFormValid}
              fields={[
                {
                  value: firstName,
                  onChange: setFirstName,
                  validator: rules.required,
                  label: `${t("profile.firstName")}*`,
                },
                {
                  value: lastName,
                  onChange: setLastName,
                  label: t("profile.lastName"),
                },
                {
                  value: username,
                  onChange: setUsername,
                  label: t("profile.username"),
                },
                {
                  value: dob,
                  onChange: (value: string) => {
                    if (value.length === 2 || value.length === 5) value += "/";
                    setDob(value);
                  },
                  validator: rules.birthday,
                  label: `${t("profile.birthday")} (DD/MM/YYYY)`,
                  keyboardType: "number-pad",
                  maxLength: 10,
                },

                {
                  inner: [
                    {
                      value: areaCode?.toString(),
                      onChange: (value: string) => {
                        try {
                          const num = Number(value);
                          setAreaCode(num);
                        } catch (error) {}
                      },
                      keyboardType: "number-pad",
                      label: t("profile.areaCode"),
                      flex: 2,
                    },
                    {
                      value: phone,
                      onChange: setPhone,
                      keyboardType: "phone-pad",
                      label: t("profile.phone"),
                      flex: 4,
                    },
                  ],
                },
              ]}
            />
          </>
        )}
      </ScrollView>
      <View style={style.footer}>
        <Button
          mode="contained"
          textColor={theme.colors.textOnPrimary}
          style={style.button}
          labelStyle={{ marginVertical: theme.spacing.sm }}
          onPress={handleEdit}
          loading={loading}
          disabled={loading}
          icon={() => (success && editing ? <SuccessCircleIcon fill={theme.colors.textOnPrimary} size={24} /> : undefined)}
        >
          {editing ? t("profile.save") : t("profile.edit")}
        </Button>
      </View>
    </MainBody>
  );
}

const useStyle = ({ theme }: { theme: AppTheme }) =>
  StyleSheet.create({
    scrollView: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: NAVBAR_HEIGHT + 120,
      flexGrow: 1,
    },
    footer: {
      bottom: NAVBAR_HEIGHT,
      left: 0,
      right: 0,
      position: "absolute",
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.background.concat("80"),
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    button: {
      borderRadius: theme.borderRadius.xs,
    },
  });
