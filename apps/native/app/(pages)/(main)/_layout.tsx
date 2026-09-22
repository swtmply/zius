import { Stack } from "expo-router/stack";
import { useCSSVariable } from "uniwind";

export default function StackLayout() {
  const page = useCSSVariable("--page") as string;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { backgroundColor: page },
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
