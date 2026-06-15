import React, { useEffect, useState } from "react";
import { Modal, View, StyleSheet, ActivityIndicator, TouchableOpacity, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as SecureStore from "expo-secure-store";
import { useAppTheme } from "@/providers/style_provider";

const PRE_TEST_URL = "https://tally.so/r/2EvZWM";
const STORAGE_KEY = "has_completed_survey";

export default function PreTestQuestionnaireModal() {
  const [visible, setVisible] = useState(false);
  const { theme } = useAppTheme();
  const { top, bottom } = useSafeAreaInsets();

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeen = await SecureStore.getItemAsync(STORAGE_KEY);
      if (!hasSeen) {
        setVisible(true);
      }
    } catch (error) {
      console.error("Error checking first time status:", error);
    }
  };

  const handleClose = async () => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, "true");
      setVisible(false);
    } catch (error) {
      console.error("Error saving first time status:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="fullScreen"
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { paddingTop: top, backgroundColor: theme.colors.background, borderBottomColor: theme.colors.grey3 ?? "#e0e0e0" }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Quick Survey</Text>
          <TouchableOpacity onPress={handleClose} style={styles.skipButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.skipText, { color: theme.colors.primary }]}>Skip</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: PRE_TEST_URL }}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
          style={styles.webview}
        />
        <TouchableOpacity onPress={handleClose} style={[styles.closeBar, { paddingBottom: bottom, backgroundColor: theme.colors.background, borderTopColor: theme.colors.grey3 ?? "#e0e0e0" }]}>
          <Text style={[styles.closeBarText, { color: theme.colors.grey1 ?? "#888" }]}>Close survey</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  closeBar: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  closeBarText: {
    fontSize: 14,
  },
});
