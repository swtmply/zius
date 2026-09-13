import { Redirect } from "expo-router";
import { Stack } from "expo-router/stack";

import DashboardLoading from "@/components/dashboard/loading";
import { authClient } from "@/lib/auth-client";

export default function StackLayout() {
  const { data: session, isPending } = authClient.useSession();

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
        contentStyle: { backgroundColor: "#FAFAF8" },
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
