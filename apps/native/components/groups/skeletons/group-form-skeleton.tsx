import { ChevronLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import { Button, Skeleton } from "heroui-native";
import { View } from "react-native";

export function GroupFormLoading() {
  const router = useRouter();

  return (
    <View
      className="bg-page flex-1 gap-4 px-4 pt-safe pb-safe"
      accessible
      accessibilityLabel="Loading group form"
      accessibilityState={{ busy: true }}
    >
      <View className="flex-row items-center justify-between gap-4 py-4">
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
        >
          <HugeiconsIcon icon={ChevronLeft} size={24} />
        </Button>
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="size-12 rounded-full" />
      </View>

      <Skeleton className="h-14 w-full rounded-2xl" />

      <View className="flex-row items-center justify-between gap-4">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-7 w-32 rounded-full" />
      </View>

      <View className="gap-3 rounded-2xl bg-panel p-4">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-24 rounded" />
          </View>
          <Skeleton className="size-8 rounded-full" />
        </View>
        <Skeleton className="h-7 w-full rounded-full" />
      </View>
    </View>
  );
}
