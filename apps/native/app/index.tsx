import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Skeleton } from "heroui-native";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Onboarding } from "@/components/onboarding";
import { SignIn } from "@/components/sign-in";
import { authClient } from "@/lib/auth-client";

const ONBOARDING_STORAGE_KEY = "zius-onboarding-complete";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { data: session, isPending } = authClient.useSession();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(
    __DEV__ ? false : null,
  );

  useEffect(() => {
    if (__DEV__) return;

    let mounted = true;

    void SecureStore.getItemAsync(ONBOARDING_STORAGE_KEY)
      .then((value) => {
        if (mounted) setHasCompletedOnboarding(value === "true");
      })
      .catch(() => {
        if (mounted) setHasCompletedOnboarding(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function completeOnboarding() {
    if (!__DEV__) {
      await SecureStore.setItemAsync(ONBOARDING_STORAGE_KEY, "true");
    }

    setHasCompletedOnboarding(true);
  }

  if (hasCompletedOnboarding === null) {
    return <View style={{ flex: 1, backgroundColor: "#F2F2F7" }} />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <View
          className="w-full max-w-[420px] gap-4 px-4"
          accessible
          accessibilityLabel="Loading sign in"
          accessibilityState={{ busy: true }}
        >
          <Skeleton className="h-8 w-20 self-center rounded-lg" />
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-14 w-full rounded-2xl" />
          ))}
        </View>
      </View>
    );
  }

  if (session?.user) {
    return <Redirect href="/home" />;
  }

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: Math.max(insets.top, 24) + 27,
        paddingBottom: Math.max(insets.bottom, 24),
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
      }}
    >
      <SignIn />
    </KeyboardAwareScrollView>
  );
}
