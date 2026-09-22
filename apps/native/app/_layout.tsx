import "@/global.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { HeroUINativeProvider } from "heroui-native";
import { queryClient, queryPersistOptions } from "@/utils/trpc";
import { AppThemeProvider } from "@/contexts/app-theme-context";
import { StatusBar } from "expo-status-bar";
import { AppUpdateGate } from "@/components/layout/app-update-gate";
import { DashboardLoading } from "@/components/layout/skeletons/dashboard-skeleton";
import { authClient } from "@/lib/auth-client";

function RootNavigator() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <DashboardLoading showScanButton={false} />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="email-verified" />
      <Stack.Protected guard={session?.user.emailVerified === true}>
        <Stack.Screen name="(pages)/(main)" />
        <Stack.Screen name="(pages)/(modals)/expenses/index" />
        <Stack.Screen name="(pages)/(modals)/expenses/create" />
        <Stack.Screen name="(pages)/(modals)/expenses/[expenseId]" />
        <Stack.Screen name="(pages)/(modals)/groups/index" />
        <Stack.Screen name="(pages)/(modals)/groups/create" />
        <Stack.Screen name="(pages)/(modals)/groups/[groupId]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={queryPersistOptions}>
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
              <AppUpdateGate>
                <StatusBar style="auto" />
                <RootNavigator />
              </AppUpdateGate>
            </HeroUINativeProvider>
          </AppThemeProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
