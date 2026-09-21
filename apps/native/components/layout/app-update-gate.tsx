import { useQuery } from "@tanstack/react-query";
import { env } from "@zius/env/native";
import Constants from "expo-constants";
import { Button, Typography } from "heroui-native";
import type { ReactNode } from "react";
import { Alert, Linking, Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

import { isOlderVersion } from "@/utils/app-version";

const appVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/);
const compatibilitySchema = z.object({
  ios: z.object({ minimumVersion: appVersionSchema, storeUrl: z.url().nullable() }),
  android: z.object({ minimumVersion: appVersionSchema, storeUrl: z.url().nullable() }),
});

async function getCompatibility() {
  const response = await fetch(`${env.EXPO_PUBLIC_SERVER_URL}/mobile-compatibility`, {
    headers: env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET }
      : undefined,
  });
  if (!response.ok) throw new Error(`Compatibility check failed: ${response.status}`);
  return compatibilitySchema.parse(await response.json());
}

export function AppUpdateGate({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : null;
  const currentVersion = Constants.expoConfig?.version ?? "0.0.0";
  const { data, refetch } = useQuery({
    queryKey: ["mobile-compatibility"],
    queryFn: getCompatibility,
    enabled: platform !== null,
    retry: 1,
  });
  const requirement = platform ? data?.[platform] : undefined;

  if (!requirement || !isOlderVersion(currentVersion, requirement.minimumVersion)) {
    return children;
  }
  const storeUrl = requirement.storeUrl;

  return (
    <View
      className="flex-1 items-center justify-center gap-4 bg-page px-4"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View className="items-center gap-1">
        <Typography className="text-center text-2xl font-semibold text-ink">
          Update required
        </Typography>
        <Typography className="text-center text-xs text-muted">
          Install the latest version of Zius to continue. You have {currentVersion}; version{" "}
          {requirement.minimumVersion} or newer is required.
        </Typography>
      </View>
      {storeUrl ? (
        <Button
          onPress={() =>
            void Linking.openURL(storeUrl).catch(() => {
              Alert.alert("Could not open the app store", "Please try again.");
            })
          }
        >
          <Button.Label>Update Zius</Button.Label>
        </Button>
      ) : (
        <Button variant="secondary" onPress={() => void refetch()}>
          <Button.Label>Try Again</Button.Label>
        </Button>
      )}
    </View>
  );
}
