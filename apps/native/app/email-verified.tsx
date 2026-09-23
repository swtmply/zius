import { useLinkingURL } from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { Button, Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { authClient, persistAuthCookie } from "@/lib/auth-client";
import { useRouter } from "@/utils/navigation";
import { clearPersistedQueryCache } from "@/utils/trpc";

export default function EmailVerified() {
  const params = useLocalSearchParams<{ error?: string | string[] }>();
  const linkingURL = useLinkingURL();
  const { data: session, error: sessionError, isRefetching, refetch } = authClient.useSession();
  const router = useRouter();
  const [failure, setFailure] = useState<string | null>(null);
  const [cookieStored, setCookieStored] = useState(false);
  // Read the cookie from the raw deep link: expo-router's params decode it one
  // extra time, turning the signed token's `+` into a space and breaking it.
  const cookie = linkingURL ? new URL(linkingURL).searchParams.get("cookie") : null;
  const verificationError = Array.isArray(params.error) ? params.error[0] : params.error;
  const verified = session?.user.emailVerified === true;

  useEffect(() => {
    if (verificationError) {
      setFailure("The verification link is invalid or expired.");
      return;
    }

    let active = true;
    void (async () => {
      try {
        if (cookie) await persistAuthCookie(cookie);
        // Refresh the shared session atom with the stored cookie, so the route
        // guard and tRPC both see the verified session before we navigate.
        await refetch();
        if (active) setCookieStored(true);
      } catch {
        if (active) setFailure("The app could not finish signing you in.");
      }
    })();

    return () => {
      active = false;
    };
  }, [cookie, refetch, verificationError]);

  useEffect(() => {
    if (!cookieStored || !verified) return;

    let active = true;
    void clearPersistedQueryCache().then(() => {
      if (active) router.replace("/home");
    });

    return () => {
      active = false;
    };
  }, [cookieStored, router, verified]);

  const failed =
    failure ??
    (sessionError || (cookieStored && !isRefetching && !verified)
      ? "The app could not finish signing you in. Please log in again."
      : null);

  return (
    <ScrollView
      className="flex-1 bg-page"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="flex-grow items-center justify-center gap-4 px-4 pb-safe-offset-8"
    >
      <View className="w-full max-w-[420px] items-center gap-1">
        <Typography className="text-center text-2xl font-semibold text-ink">
          {failed ? "Could not sign you in" : "Finishing verification"}
        </Typography>
        <Typography selectable className="text-center text-xs text-muted">
          {failed ?? "Your email is confirmed. Zius will open in a moment."}
        </Typography>
      </View>

      {failed ? (
        <Button className="w-full max-w-[420px]" onPress={() => router.replace("/")}>
          <Button.Label>Back to login</Button.Label>
        </Button>
      ) : (
        <ActivityIndicator accessibilityLabel="Signing in" colorClassName="accent-ink" />
      )}
    </ScrollView>
  );
}
