import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { HeroUINativeProvider } from "heroui-native";
import { queryClient } from "@/utils/trpc";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <AppThemeProvider>
            <HeroUINativeProvider>
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(forms)/create-transaction" />
                <Stack.Screen name="(forms)/create-group" />
                <Stack.Screen name="(modals)/groups/index" />
                <Stack.Screen name="(modals)/groups/[groupId]" />
                <Stack.Screen name="(modals)/transactions" />
                <Stack.Screen name="(modals)/transactions/[transactionId]" />
              </Stack>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
