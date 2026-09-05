import BalanceCard from "@/components/dashboard/balance-card";
import DashboardHeader from "@/components/dashboard/header";
import DashboardLoading from "@/components/dashboard/loading";
import { ActiveExpenses, ExpensesEmptyState } from "@/components/dashboard/expenses";
import { SectionHeader } from "@/components/section-header";
import { formatCurrency, formatDate } from "@/utils";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Button, cn, PressableFeedback, Typography } from "heroui-native";
import { useRouter } from "expo-router";
import { FlatList, View } from "react-native";

export default function Home() {
  const { data, isLoading } = useQuery(trpc.dashboard.get.queryOptions());
  const router = useRouter();

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <View className="bg-background flex-1">
      <FlatList
        ListHeaderComponent={
          <View className="pt-safe gap-4">
            <DashboardHeader />

            <BalanceCard
              owedToYouMinor={data?.balance?.owedToYouMinor ?? 0}
              youOweMinor={data?.balance?.youOweMinor ?? 0}
            />

            <ActiveExpenses expenses={data?.activeExpenses || []} />

            <SectionHeader
              title="Recent Expenses"
              action={
                (data?.recentExpenses.length ?? 0) > 0 ? (
                  <Button
                    variant="ghost"
                    onPress={() =>
                      router.push({
                        pathname: "/(modals)/expenses",
                        params: {
                          sort: "desc",
                          type: "settled",
                        },
                      })
                    }
                  >
                    <Typography className="text-sm text-muted">See All</Typography>
                  </Button>
                ) : null
              }
            />
          </View>
        }
        contentContainerClassName="px-4 pb-8"
        data={data?.recentExpenses}
        ListEmptyComponent={
          <ExpensesEmptyState
            title="No recent expenses"
            description="Create your first expense to start tracking shared spending."
          />
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PressableFeedback
            onPress={() =>
              router.push({
                pathname: "/(modals)/expenses/[expenseId]",
                params: {
                  expenseId: item.id,
                },
              })
            }
          >
            <View
              className={cn(
                "flex-row items-center justify-between gap-2 py-2 border-border",
                data?.recentExpenses.length === index + 1 ? "" : "border-b",
              )}
            >
              <View className="flex-1 gap-1">
                <Typography className="text-sm">{item.title}</Typography>
                <Typography className="text-xs text-muted">
                  {formatDate(new Date(item.occurredAt))}
                </Typography>
              </View>
              <Typography className="text-sm font-semibold">
                {formatCurrency(item.totalMinor)}
              </Typography>
            </View>
          </PressableFeedback>
        )}
      />
    </View>
  );
}
