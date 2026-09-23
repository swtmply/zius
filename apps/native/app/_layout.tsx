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
import { authClient } from "@/lib/auth-client";
import { ensureRevenueCat } from "@/utils/revenuecat";
import { useEffect, useState } from "react";
import { View } from "react-native";

function RootNavigator() {
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (session?.user.emailVerified) void ensureRevenueCat(session.user.id).catch(() => {});
  }, [session?.user.id, session?.user.emailVerified]);
  // better-auth flips isPending back to true on every refetch while signed out.
  // Only block on the first load so refetches never unmount the navigator.
  const [loaded, setLoaded] = useState(false);
  if (!isPending && !loaded) setLoaded(true);

  if (!loaded) return <View className="flex-1 bg-page" />;

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
        <Stack.Screen name="(pages)/(modals)/scan-credits" />
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
