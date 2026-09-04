import { Redirect } from "expo-router";
import { Skeleton } from "heroui-native";
import { View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignIn } from "@/components/sign-in";
import { authClient } from "@/lib/auth-client";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { data: session, isPending } = authClient.useSession();

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
