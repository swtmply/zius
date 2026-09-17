import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";
import { useCSSVariable } from "uniwind";

import { DashboardLoading } from "@/components/layout/skeletons/dashboard-skeleton";
import { authClient } from "@/lib/auth-client";

export default function StackLayout() {
  const { data: session, isPending } = authClient.useSession();
  const page = useCSSVariable("--page") as string;

  if (isPending) {
    return <DashboardLoading showScanButton={false} />;
  }

  if (!session?.user) {
    return <Redirect href="/" />;
  }

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
