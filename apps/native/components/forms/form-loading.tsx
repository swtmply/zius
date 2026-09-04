import { Skeleton } from "heroui-native";
import { View } from "react-native";

export function FormLoading() {
  return (
    <View
      className="bg-background flex-1 pt-safe px-4 gap-4"
      accessible
      accessibilityLabel="Loading form"
      accessibilityState={{ busy: true }}
    >
      <View className="flex-row items-center justify-between gap-4 py-4">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="size-12 rounded-full" />
      </View>
      {[0, 1, 2].map((field) => (
        <View key={field} className="gap-1">
          <Skeleton className="h-4 w-24 rounded-sm" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </View>
      ))}
    </View>
  );
}
