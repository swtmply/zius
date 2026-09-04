import { Skeleton } from "heroui-native";
import { View } from "react-native";

export function GroupParticipantsLoading({ folded }: { folded: boolean }) {
  return (
    <View
      className={folded ? "flex-row flex-wrap items-center justify-start" : "gap-4"}
      accessible
      accessibilityLabel="Loading participants"
      accessibilityState={{ busy: true }}
    >
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <View
          key={index}
          className={folded ? (index === 0 ? undefined : "-ml-4") : "flex-row items-center gap-4"}
        >
          <Skeleton className="size-10 rounded-full" />
          {!folded && <Skeleton className="h-5 w-20 rounded-sm" />}
        </View>
      ))}
    </View>
  );
}

export function GroupTransactionsLoading() {
  return (
    <View
      className="gap-4"
      accessible
      accessibilityLabel="Loading transactions"
      accessibilityState={{ busy: true }}
    >
      {[0, 1].map((index) => (
        <View key={index} className="bg-surface border border-border rounded-xl p-4 gap-2">
          <View className="gap-1">
            <View className="flex-row items-center justify-between gap-2">
              <Skeleton className="h-5 w-28 rounded-sm" />
              <Skeleton className="h-5 w-14 rounded-sm" />
            </View>
            <Skeleton className="h-4 w-20 rounded-sm" />
          </View>
          <View className="border-t border-dashed border-border pt-2">
            <View className="flex-row flex-wrap items-center justify-start">
              {[0, 1, 2, 3].map((person, personIndex) => (
                <Skeleton
                  key={person}
                  className={
                    personIndex === 0 ? "size-10 rounded-full" : "size-10 rounded-full -ml-4"
                  }
                />
              ))}
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
