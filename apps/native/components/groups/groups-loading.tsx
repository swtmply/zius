import { View } from "react-native";
import { Skeleton } from "heroui-native";

export function GroupsLoading({ count = 4 }: { count?: number }) {
  return (
    <View
      className="gap-4"
      accessible
      accessibilityLabel="Loading groups"
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} className="bg-panel rounded-2xl p-4 gap-3">
          <Skeleton className="h-5 w-1/3 rounded" />
          <View className="border-t border-dashed border-border pt-3">
            <View className="flex-row items-center gap-1">
              {[0, 1, 2].map((participant) => (
                <Skeleton key={participant} className="size-8 rounded-full" />
              ))}
              <Skeleton className="size-8 rounded-full" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
