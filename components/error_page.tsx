import { useAppTheme } from "@/providers/style_provider";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function ErrorPage({ message }: { message?: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignContent: "center", paddingHorizontal: theme.spacing.xl }}>
      <Text variant="headlineMedium" style={{ color: theme.colors.error, fontWeight: "bold", textAlign: "center" }}>
        {message || "404 Not Found :("}
      </Text>
    </View>
  );
}
