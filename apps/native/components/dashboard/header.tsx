import { Notification } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { Avatar, Button, PressableFeedback, Typography } from "heroui-native";
import { authClient } from "@/lib/auth-client";

export default function DashboardHeader() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <View className="pt-4 flex-row justify-between items-center">
      <Typography className="text-2xl font-semibold text-ink">Dashboard</Typography>

      <View className="flex-row items-center gap-2">
        <Button
          variant="ghost"
          isIconOnly
          accessibilityLabel="Notifications"
          onPress={() => router.push("/(tabs)/notifications")}
        >
          <HugeiconsIcon icon={Notification} size={24} color="#000000" />
        </Button>
        <PressableFeedback onPress={() => router.push("/(tabs)/settings")}>
          <Avatar size="md">
            <Avatar.Image source={{ uri: session?.user?.image ?? "" }} />
            <Avatar.Fallback>{session?.user?.name[0]}</Avatar.Fallback>
          </Avatar>
        </PressableFeedback>
      </View>
    </View>
  );
}
