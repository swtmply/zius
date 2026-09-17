import { useInfiniteQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "@/utils/navigation";
import { FlatList, View } from "react-native";

import { ExpensesEmptyState } from "@/components/expenses/expense-dashboard-list";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { type ExpenseSort, type ExpenseStatus } from "@/components/expenses/expense-filters";
import { ExpensesHeader } from "@/components/expenses/expenses-header";
import { ExpensesLoading, ExpensesQueryFooter } from "@/components/expenses/skeletons/expenses-skeleton";
import { trpc } from "@/utils/trpc";

export default function ExpensesPage() {
  const params = useLocalSearchParams<{
    sort?: string;
    status?: string;
    type?: string;
  }>();
  const router = useRouter();
  const rawStatus = params.status ?? params.type;
  const status: ExpenseStatus =
    rawStatus === "all" ||
    rawStatus === "active" ||
    rawStatus === "settled" ||
    rawStatus === "cancelled"
      ? rawStatus
      : "active";
  const sort: ExpenseSort = params.sort === "oldest" || params.sort === "asc" ? "oldest" : "newest";
  const query = useInfiniteQuery(
    trpc.expense.list.infiniteQueryOptions(
      { status, sort },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const expenses = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View className="bg-page flex-1">
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={<ExpensesHeader status={status} sort={sort} />}
        contentContainerClassName="gap-3 px-4 pb-safe-offset-8"
        data={expenses}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={<View className="h-1" />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => {
          void query.refetch();
        }}
        ListEmptyComponent={
          query.isPending ? (
            <ExpensesLoading />
          ) : !query.isError ? (
            <ExpensesEmptyState
              title="No expenses"
              description="No expenses match these filters."
            />
          ) : null
        }
        ListFooterComponent={
          <ExpensesQueryFooter
            hasExpenses={expenses.length > 0}
            hasNextPage={query.hasNextPage}
            isError={query.isError}
            isFetchNextPageError={query.isFetchNextPageError}
            isFetchingNextPage={query.isFetchingNextPage}
            onRetry={() => {
              if (query.isFetchNextPageError) void query.fetchNextPage();
              else void query.refetch();
            }}
          />
        }
        renderItem={({ item }) => (
          <ExpenseCard
            expense={item}
            onPress={() =>
              router.push({
                pathname: "/expenses/[expenseId]",
                params: { expenseId: item.id },
              })
            }
          />
        )}
      />
    </View>
  );
}
