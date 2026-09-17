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
            <HeroUINativeProvider
              config={{
                devInfo: {
                  stylingPrinciples: false,
                },
              }}
            >
              <StatusBar style="auto" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(pages)/(main)" />
                <Stack.Screen name="(pages)/(modals)/expenses/index" />
                <Stack.Screen name="(pages)/(modals)/expenses/create" />
                <Stack.Screen name="(pages)/(modals)/expenses/[expenseId]" />
                <Stack.Screen name="(pages)/(modals)/groups/index" />
                <Stack.Screen name="(pages)/(modals)/groups/create" />
                <Stack.Screen name="(pages)/(modals)/groups/[groupId]" />
              </Stack>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
