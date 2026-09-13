import DashboardHeaderCard, { type HeaderCardAction } from "@/components/dashboard/header-card";
import DashboardHeader from "@/components/dashboard/header";
import DashboardLoading from "@/components/dashboard/loading";
import { DashboardExpenses, ExpensesEmptyState } from "@/components/dashboard/expenses";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Button } from "heroui-native";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Add,
  MoreHorizontal,
  Scan,
  TransactionHistoryIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";

export default function Home() {
  const { data, isLoading, isRefetching, refetch } = useQuery(trpc.dashboard.get.queryOptions());
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerActions = [
    {
      id: "transaction",
      label: "Transaction",
      accessibilityLabel: "Create transaction",
      icon: Add,
      onPress: () => router.push("/create-expense"),
    },
    {
      id: "groups",
      label: "Groups",
      accessibilityLabel: "View groups",
      icon: UserGroup03Icon,
      onPress: () =>
        router.push({
          pathname: "/(modals)/groups",
          params: { sort: "desc", type: "all" },
        }),
    },
    {
      id: "history",
      label: "History",
      accessibilityLabel: "View history",
      icon: TransactionHistoryIcon,
      onPress: () =>
        router.push({
          pathname: "/(modals)/expenses",
          params: { sort: "desc", status: "active" },
        }),
    },
    {
      id: "more",
      label: "More",
      accessibilityLabel: "More settings",
      icon: MoreHorizontal,
      onPress: () => router.push("/(tabs)/settings"),
    },
  ] satisfies readonly HeaderCardAction[];

  if (isLoading) return <DashboardLoading />;

  return (
    <View
      className="bg-page flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
    >
      <ScrollView
        contentContainerClassName="p-4 gap-2"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              void refetch();
            }}
          />
        }
      >
        <DashboardHeader />
        {!data ? (
          <View className="gap-4">
            <ExpensesEmptyState
              title="Could not load dashboard"
              description="Try again to load your balances and expenses."
            />
            <Button
              onPress={() => {
                void refetch();
              }}
            >
              <Button.Label>Try Again</Button.Label>
            </Button>
          </View>
        ) : (
          <>
            <DashboardHeaderCard
              owedToYouMinor={data.balance.owedToYouMinor}
              youOweMinor={data.balance.youOweMinor}
              actions={headerActions}
            />
            <DashboardExpenses expenses={data.activeExpenses} />
            <DashboardExpenses expenses={data.settledExpenses} settled />
          </>
        )}
        <View className="h-14" />
      </ScrollView>
      <Button
        className="absolute right-4 size-18 rounded-full bg-dark-gradient"
        style={{ bottom: insets.bottom + 16 }}
        isIconOnly
        accessibilityLabel="Scan receipt"
        onPress={() => router.push("/(tabs)/scan")}
      >
        <HugeiconsIcon icon={Scan} size={28} color="#FFFFFF" />
      </Button>
    </View>
  );
}
