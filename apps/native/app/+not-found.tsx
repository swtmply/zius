import { Link } from "expo-router";
import { Button, Typography } from "heroui-native";
import { ScrollView, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <ScrollView
      className="flex-1 bg-page"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="flex-grow items-center justify-center p-6"
    >
      <View className="w-full max-w-[360px] items-center gap-4">
        <Typography selectable className="text-center text-2xl font-semibold text-ink">
          Page not found
        </Typography>
        <Typography selectable className="text-center text-xs text-supporting">
          This page does not exist.
        </Typography>
        <Link href="/" asChild>
          <Button className="h-12 rounded-2xl bg-contrast-gradient px-6">
            <Button.Label className="text-sm font-bold text-on-ink">Go home</Button.Label>
          </Button>
        </Link>
      </View>
    </ScrollView>
  );
}
