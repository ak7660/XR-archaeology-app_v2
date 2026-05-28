import React, { useEffect, useState } from "react";
import { Modal, View, StyleSheet, ActivityIndicator } from "react-native";
import { IconButton } from "react-native-paper";
import { WebView } from "react-native-webview";
import * as SecureStore from "expo-secure-store";
import { useAppTheme } from "@/providers/style_provider";

const PRE_TEST_URL = "https://tally.so/r/2EvZWM";
const STORAGE_KEY = "has_completed_survey";

export default function PreTestQuestionnaireModal() {
  const [visible, setVisible] = useState(false);
  const { theme } = useAppTheme();

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
        <View style={styles.header}>
          <IconButton
            icon="close"
            size={24}
            onPress={handleClose}
            iconColor={theme.colors.text}
          />
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 50,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 10,
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
});
