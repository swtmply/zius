import { useLocalSearchParams } from "expo-router";
import { Button, Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";

import { authClient, persistAuthCookie } from "@/lib/auth-client";
import { useRouter } from "@/utils/navigation";
import { clearPersistedQueryCache } from "@/utils/trpc";

export default function EmailVerified() {
  const params = useLocalSearchParams<{
    cookie?: string | string[];
    error?: string | string[];
  }>();
  const { data: session, error: sessionError, refetch } = authClient.useSession();
  const router = useRouter();
  const [failure, setFailure] = useState<string | null>(null);
  const cookie = Array.isArray(params.cookie) ? params.cookie[0] : params.cookie;
  const verificationError = Array.isArray(params.error) ? params.error[0] : params.error;

  useEffect(() => {
    if (verificationError) {
      setFailure("The verification link is invalid or expired.");
      return;
    }
    if (!cookie) {
      setFailure("The verification succeeded, but the app could not create your session.");
      return;
    }

    let active = true;
    void persistAuthCookie(cookie)
      .then(() => refetch())
      .catch(() => {
        if (active) setFailure("The app could not finish signing you in.");
      });

    return () => {
      active = false;
    };
  }, [cookie, refetch, verificationError]);

  useEffect(() => {
    if (!session?.user.emailVerified) return;

    let active = true;
    void clearPersistedQueryCache().then(() => {
      if (active) router.replace("/home");
    });

    return () => {
      active = false;
    };
  }, [router, session?.user.emailVerified]);

  const failed = failure ?? (sessionError ? "The app could not finish signing you in." : null);

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
