import { useLocalSearchParams } from "expo-router";
import { Button, Typography } from "heroui-native";
import { ScrollView, View } from "react-native";

import { useRouter } from "@/utils/navigation";

export default function EmailVerified() {
  const { error } = useLocalSearchParams<{ error?: string | string[] }>();
  const router = useRouter();
  const failed = Boolean(error);

  return (
    <ScrollView
      className="flex-1 bg-page"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="flex-grow items-center justify-center gap-4 px-4 pb-safe-offset-8"
    >
      <View className="w-full max-w-[420px] items-center gap-1">
        <Typography className="text-center text-2xl font-semibold text-ink">
          {failed ? "Verification link expired" : "Email verified"}
        </Typography>
        <Typography selectable className="text-center text-xs text-muted">
          {failed
            ? "Return to login to request a new verification email."
            : "Your email is confirmed. You can now sign in to Zius."}
        </Typography>
      </View>

      <Button className="w-full max-w-[420px]" onPress={() => router.replace("/")}>
        <Button.Label>{failed ? "Back to login" : "Continue to login"}</Button.Label>
      </Button>
    </ScrollView>
  );
}
