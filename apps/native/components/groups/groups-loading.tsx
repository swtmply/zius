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
        <View key={index} className="bg-surface border border-border rounded-xl p-4 gap-2">
          <Skeleton className="h-5 w-1/3 rounded-sm" />
          <View className="flex-row flex-wrap items-center justify-start">
            {[0, 1, 2].map((participant, index) => (
              <Skeleton
                key={participant}
                className={index === 0 ? "size-10 rounded-full" : "size-10 rounded-full -ml-4"}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
