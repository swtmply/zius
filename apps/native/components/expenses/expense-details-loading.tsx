import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Skeleton, Typography } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";

export function ExpenseDetailsLoading() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  return (
    <View
      className="gap-4"
      accessibilityLabel="Loading expense details"
      accessibilityState={{ busy: true }}
    >
      <View className="flex-row items-center justify-between gap-4 py-4">
        <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={goBack}>
          <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} color="#000000" />
        </Button>
        <Skeleton className="h-8 w-40 rounded-md" />
        <Skeleton className="size-12 rounded-full" />
      </View>

      <View className="gap-4">
        <View className="flex-row gap-2">
          {["total", "owed"].map((item) => (
            <View key={item} className="flex-1 gap-2 rounded-2xl bg-dark-gradient p-4">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
            </View>
          ))}
        </View>

        <View className="rounded-2xl bg-panel p-4">
          <View className="flex-row items-center">
            {[
              ["payer", "size-12"],
              ["split", "size-12"],
              ["group", "size-12"],
              ["status", "size-12"],
            ].map(([item, size]) => (
              <View key={item} className="flex-1 items-center gap-1">
                <Skeleton className={`${size} rounded-full`} />
                <Skeleton className="h-3 w-16 rounded-sm" />
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className="gap-2">
        <Typography className="text-sm text-ink">Expense Summary</Typography>
        <View className="gap-2 rounded-2xl bg-panel p-4">
          {["one", "two", "three"].map((item, index) => (
            <View key={item} className="gap-2">
              {index > 0 ? <View className="border-t border-dashed border-border" /> : null}
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1 flex-row items-center gap-1">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-28 rounded-sm" />
                </View>
                <Skeleton className="h-4 w-16 rounded-sm" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
