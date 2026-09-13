import { Skeleton, Typography } from "heroui-native";
import { View } from "react-native";

export function GroupParticipantsLoading({ folded }: { folded: boolean }) {
  return (
    <View
      className="rounded-2xl bg-panel p-4"
      accessible
      accessibilityLabel="Loading participants"
      accessibilityState={{ busy: true }}
    >
      <View className={folded ? "flex-row flex-wrap items-center justify-start gap-1" : "gap-2"}>
        {[0, 1, 2, 3, 4, 5].map((index) =>
          folded ? (
            <Skeleton key={index} className="size-8 rounded-full" />
          ) : (
            <View key={index} className="flex-row items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-sm" />
            </View>
          ),
        )}
      </View>
    </View>
  );
}

export function GroupExpensesLoading({ count = 2 }: { count?: number } = {}) {
  return (
    <View
      className="gap-2"
      accessible
      accessibilityLabel="Loading expenses"
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} className="gap-3 rounded-2xl bg-panel p-4">
          <View className="flex-row items-center justify-between gap-2">
            <Skeleton className="size-10 rounded-full" />
            <View className="flex-1 gap-1">
              <Skeleton className="h-5 w-28 rounded-sm" />
              <Skeleton className="h-4 w-20 rounded-sm" />
            </View>
            <Skeleton className="h-5 w-14 rounded-sm" />
          </View>
          <View className="border-t border-dashed border-border bg-transparent" />
          <View className="flex-row items-center gap-1">
            {[0, 1, 2, 3].map((person) => (
              <Skeleton key={person} className="size-8 rounded-full" />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function GroupExpensesSectionLoading({
  title,
  showAction = false,
}: {
  title: string;
  showAction?: boolean;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-4">
        <Typography className="text-sm text-ink">{title}</Typography>
        {showAction ? <Skeleton className="h-8 w-28 rounded-full" /> : null}
      </View>
      <GroupExpensesLoading />
    </View>
  );
}
