import { Button, Skeleton, Typography } from "heroui-native";
import { View } from "react-native";

export function ExpensesLoading({ count = 4 }: { count?: number }) {
  return (
    <View
      className="gap-3"
      accessible
      accessibilityLabel="Loading expenses"
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} className="bg-panel rounded-2xl p-4 gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <View className="size-10 rounded-full bg-page items-center justify-center">
              <Skeleton className="size-5 rounded-full" />
            </View>
            <View className="flex-1 gap-1">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </View>
            <Skeleton className="h-5 w-20 rounded" />
          </View>
          <View className="border-t border-dashed border-border">
            <View className="flex-row items-center gap-1">
              {[0, 1, 2].map((participant) => (
                <View key={participant} className="rounded-full border-2 border-panel">
                  <Skeleton className="size-8 rounded-full" />
                </View>
              ))}
              <Skeleton className="size-8 rounded-full border-2 border-panel" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

export function ExpensesQueryFooter({
  hasExpenses,
  hasNextPage,
  isError,
  isFetchNextPageError,
  isFetchingNextPage,
  onRetry,
}: {
  hasExpenses: boolean;
  hasNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  onRetry: () => void;
}) {
  if (isError || isFetchNextPageError) {
    return (
      <View className="items-center gap-4 py-6">
        <Typography selectable className="text-xs text-supporting">
          Unable to load expenses.
        </Typography>
        <Button variant="secondary" size="sm" onPress={onRetry}>
          <Button.Label>Try again</Button.Label>
        </Button>
      </View>
    );
  }

  if (isFetchingNextPage) {
    return (
      <View className="pt-3">
        <ExpensesLoading count={2} />
      </View>
    );
  }

  if (hasExpenses && !hasNextPage) {
    return <Typography className="py-4 text-center text-xs text-supporting">No more.</Typography>;
  }

  return null;
}
