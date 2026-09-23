import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Onboarding } from "@/components/layout/onboarding/onboarding";
import { SignIn } from "@/components/layout/sign-in";
import { authClient } from "@/lib/auth-client";
import { getAlwaysShowOnboardingPages } from "@/utils/spotlights";

const ONBOARDING_STORAGE_KEY = "zius-onboarding-complete";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      SecureStore.getItemAsync(ONBOARDING_STORAGE_KEY),
      getAlwaysShowOnboardingPages(),
    ])
      .then(([value, alwaysShowOnboardingPages]) => {
        if (mounted) {
          setHasCompletedOnboarding(value === "true" && !(__DEV__ && alwaysShowOnboardingPages));
        }
      })
      .catch(() => {
        if (mounted) setHasCompletedOnboarding(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function completeOnboarding() {
    await SecureStore.setItemAsync(ONBOARDING_STORAGE_KEY, "true");

    setHasCompletedOnboarding(true);
  }

  if (hasCompletedOnboarding === null) {
    return <View className="flex-1 bg-page" />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  if (session?.user.emailVerified) {
    return <Redirect href="/home" />;
  }

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      className="flex-1 bg-page"
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="flex-grow items-center justify-center bg-page px-4"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 24) + 27,
        paddingBottom: Math.max(insets.bottom, 24),
      }}
    >
      <SignIn />
    </KeyboardAwareScrollView>
  );
}
