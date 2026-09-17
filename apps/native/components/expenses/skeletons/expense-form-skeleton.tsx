import { ChevronLeft } from "@hugeicons/core-free-icons";
import { useRouter } from "@/utils/navigation";
import { Button, Skeleton } from "heroui-native";
import { ScrollView, View } from "react-native";

import { Icon } from "@/components/icon";

export function FormLoading() {
  const router = useRouter();

  return (
    <ScrollView
      className="bg-page flex-1"
      contentContainerClassName="pt-safe pb-safe gap-4 px-4"
      contentInsetAdjustmentBehavior="automatic"
      accessible
      accessibilityLabel="Loading expense form"
      accessibilityState={{ busy: true }}
    >
      <View className="flex-row items-center justify-between gap-4 py-4">
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
        >
          <Icon icon={ChevronLeft} size={24} colorClassName="accent-ink" />
        </Button>
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="size-12 rounded-full" />
      </View>

      <View className="items-center justify-center py-4">
        <Skeleton className="h-10 w-36 rounded-lg" />
      </View>

      <Skeleton className="h-14 w-full rounded-2xl" />

      <View className="flex-row items-center gap-1 rounded-2xl bg-panel p-4">
        {[0, 1, 2, 3].map((item) => (
          <View key={item} className="flex-1 items-center gap-1">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-4 w-14 rounded" />
          </View>
        ))}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between gap-4">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </View>
        <View className="gap-3 rounded-2xl bg-panel p-4">
          {[0, 1, 2].map((item) => (
            <View key={item} className="flex-row items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 flex-1 rounded" />
              <Skeleton className="h-7 w-14 rounded-md" />
              <Skeleton className="size-7 rounded-full" />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
