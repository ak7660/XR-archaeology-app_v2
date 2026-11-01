import { LocateIcon } from "@/components/icons";
import { useTranslation } from "@/hooks/useTranslation";
import { NearbyStatus } from "@/hooks/useNearby";
import { AppTheme, useAppTheme } from "@/providers/style_provider";
import { Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

interface Props {
  status: NearbyStatus;
  onPress: () => void;
}

/**
 * Turns "Nearest first" on and off, and says what is happening: finding you,
 * sorted, or why it can't. It used to be an unlabelled sort icon, which gave
 * no hint that it was about distance or that location was needed.
 */
export default function NearbySortButton({ status, onPress }: Props) {
  const { theme } = useAppTheme();
  const style = useStyle(theme);
  const { t } = useTranslation();
  const on = status === "on";
  const locating = status === "locating";

  const label = locating ? t("nearby.locating") : on ? t("nearby.sorted") : t("nearby.sortNearest");
  const note = status === "denied" ? t("nearby.needPermission") : status === "failed" ? t("nearby.failed") : "";

  return (
    <View style={style.wrapper}>
      <Pressable
        onPress={onPress}
        disabled={locating}
        accessibilityRole="button"
        accessibilityState={{ selected: on, busy: locating }}
        accessibilityLabel={label}
        style={[style.chip, on && style.chipOn]}
      >
        {locating ? (
          <ActivityIndicator size={16} color={theme.colors.primary} />
        ) : (
          <LocateIcon fill={on ? theme.colors.textOnPrimary : theme.colors.primary} size={18} />
        )}
        <Text variant="labelMedium" style={{ color: on ? theme.colors.textOnPrimary : theme.colors.text }}>
          {label}
        </Text>
      </Pressable>
      {!!note && (
        <View style={style.noteRow}>
          <Text variant="bodySmall" style={{ color: theme.colors.grey2, flex: 1 }}>
            {note}
          </Text>
          {status === "denied" && (
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.primary }}
              onPress={() => Linking.openSettings?.() ?? (Platform.OS === "ios" && Linking.openURL("app-settings:"))}
            >
              {t("nearby.openSettings")}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const useStyle = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: { rowGap: theme.spacing.xs },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      columnGap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.container,
      minHeight: 40,
    },
    chipOn: { backgroundColor: theme.colors.primary },
    noteRow: { flexDirection: "row", alignItems: "center", columnGap: theme.spacing.xs },
  });
