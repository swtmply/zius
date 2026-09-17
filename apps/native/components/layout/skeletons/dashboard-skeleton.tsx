import { Skeleton, Typography } from "heroui-native";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function DashboardHeaderLoading() {
  return (
    <View className="pt-4 flex-row items-center justify-between">
      <Typography className="text-2xl font-semibold text-ink">Dashboard</Typography>
      <View className="flex-row items-center gap-2">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="size-12 rounded-full" />
      </View>
    </View>
  );
}

function HeaderCardLoading() {
  return (
    <View className="gap-4">
      <View className="flex-row gap-2">
        {[0, 1].map((item) => (
          <View key={item} className="flex-1 rounded-2xl bg-contrast-gradient p-4 gap-2">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-8 w-24 rounded" />
          </View>
        ))}
      </View>

      <View className="rounded-2xl bg-panel p-4">
        <View className="items-center flex-row">
          {["expense", "groups", "history", "more"].map((item) => (
            <View key={item} className="items-center flex-1 gap-1">
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-4 w-16 rounded" />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function ExpenseCardLoading() {
  return (
    <View className="bg-panel rounded-2xl p-4 gap-2">
      <View className="flex-row items-center gap-2">
        <Skeleton className="size-10 rounded-full" />
        <View className="flex-1 gap-1">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </View>
        <Skeleton className="h-5 w-16 rounded" />
      </View>

      <View className="border-t border-dashed border-border bg-transparent" />

      <View className="flex-row items-center gap-1">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className={`size-8 rounded-full`} />
        ))}
        <Skeleton className="size-8 rounded-full" />
      </View>
    </View>
  );
}

function ExpenseSectionLoading({ title }: { title: string }) {
  return (
    <View className="gap-2">
      <View className="h-12 flex-row items-center justify-between gap-4">
        <Typography className="text-sm text-ink">{title}</Typography>
        <Skeleton className="h-4 w-16 rounded" />
      </View>
      <View className="gap-2">
        {[0, 1].map((item) => (
          <ExpenseCardLoading key={item} />
        ))}
      </View>
    </View>
  );
}

interface DashboardLoadingProps {
  showScanButton?: boolean;
}

export function DashboardLoading({ showScanButton = true }: DashboardLoadingProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-page flex-1"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 16,
      }}
      accessible
      accessibilityLabel="Loading dashboard"
      accessibilityState={{ busy: true }}
    >
      <ScrollView contentContainerClassName="p-4 gap-2">
        <DashboardHeaderLoading />
        <HeaderCardLoading />
        <ExpenseSectionLoading title="Unsettled Expenses" />
        <ExpenseSectionLoading title="Settled Expenses" />
        <View className="h-14" />
      </ScrollView>
      {showScanButton ? (
        <Skeleton
          className="absolute right-4 size-18 rounded-full"
          style={{ bottom: insets.bottom + 16 }}
        />
      ) : null}
    </View>
  );
}
