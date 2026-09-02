import { Redirect } from "expo-router";
import { ActivityIndicator, ScrollView, View } from "react-native";
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
        <ActivityIndicator color="#171717" />
      </View>
    );
  }

  if (session?.user) {
    return <Redirect href="/home" />;
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
      contentInsetAdjustmentBehavior="automatic"
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
    </ScrollView>
  );
}
