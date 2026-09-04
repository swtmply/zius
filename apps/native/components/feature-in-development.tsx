import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";
import { Button, Typography } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";

export function FeatureInDevelopment() {
  const router = useRouter();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="flex-grow items-center justify-center gap-4 px-4 pb-safe-offset-8"
    >
      <View className="items-center gap-1">
        <Typography className="text-2xl font-semibold text-center">
          The developer is working on this feature
        </Typography>
        <Typography className="text-xs text-muted text-center">
          This page is still under construction. Please check back soon.
        </Typography>
      </View>
      <Button
        variant="secondary"
        accessibilityLabel="Go back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
      >
        <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
        <Button.Label>Back</Button.Label>
      </Button>
    </ScrollView>
  );
}
