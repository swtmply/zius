import BalanceCard from "@/components/dashboard/balance-card";
import DashboardHeader from "@/components/dashboard/header";
import DashboardLoading from "@/components/dashboard/loading";
import { ActiveTransactions, TransactionsEmptyState } from "@/components/dashboard/transactions";
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

            <ActiveTransactions transactions={data?.activeTransactions || []} />

            <SectionHeader
              title="Recent Transactions"
              action={
                (data?.recentTransactions.length ?? 0) > 0 ? (
                  <Button
                    variant="ghost"
                    onPress={() =>
                      router.push({
                        pathname: "/(modals)/transactions",
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
        data={data?.recentTransactions}
        ListEmptyComponent={
          <TransactionsEmptyState
            title="No recent transactions"
            description="Create your first transaction to start tracking shared expenses."
          />
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <PressableFeedback
            onPress={() =>
              router.push({
                pathname: "/(modals)/transactions/[transactionId]",
                params: {
                  transactionId: item.id,
                },
              })
            }
          >
            <View
              className={cn(
                "flex-row items-center justify-between gap-2 py-2 border-border",
                data?.recentTransactions.length === index + 1 ? "" : "border-b",
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
