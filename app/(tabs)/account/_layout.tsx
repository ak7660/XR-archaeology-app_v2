import { Stack } from "expo-router";

export default function StackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="change_password" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="trip_plans" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="help_feedback" />
      <Stack.Screen name="user_evaluation" />
    </Stack>
  );
}
