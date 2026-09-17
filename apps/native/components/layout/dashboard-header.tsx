import { Notification } from "@hugeicons/core-free-icons";
import { useRouter } from "@/utils/navigation";
import { View } from "react-native";
import { Avatar, Button, PressableFeedback, Typography } from "heroui-native";
import { Icon } from "@/components/icon";
import { authClient } from "@/lib/auth-client";

export function DashboardHeader() {
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
          onPress={() => router.push("/notifications")}
        >
          <Icon icon={Notification} size={24} colorClassName="accent-ink" />
        </Button>
        <PressableFeedback
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => router.push("/settings")}
        >
          <Avatar size="md">
            {session?.user?.image ? <Avatar.Image source={{ uri: session.user.image }} /> : null}
            <Avatar.Fallback>{session?.user?.name.slice(0, 1)}</Avatar.Fallback>
          </Avatar>
        </PressableFeedback>
      </View>
    </View>
  );
}
