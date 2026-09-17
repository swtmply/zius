import {
  DashboardHeaderCard,
  type HeaderCardAction,
} from "@/components/layout/dashboard-header-card";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardLoading } from "@/components/layout/skeletons/dashboard-skeleton";
import {
  DashboardExpenses,
  ExpensesEmptyState,
} from "@/components/expenses/expense-dashboard-list";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { Button } from "heroui-native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import MockHome from "@/components/layout/onboarding/mock-screens/home";
import { getAlwaysShowSpotlights } from "@/utils/spotlights";

const HOME_ONBOARDING_STORAGE_KEY = "home-onboarding-completed";
const HOME_ONBOARDING_COMPLETED_VALUE = "true";

export default function Home() {
  const { data, isLoading, isRefetching, refetch } = useQuery(
    trpc.dashboard.get.queryOptions(),
  );
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showHomeOnboarding, setShowHomeOnboarding] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    void Promise.all([
      SecureStore.getItemAsync(HOME_ONBOARDING_STORAGE_KEY),
      getAlwaysShowSpotlights(),
    ])
      .then(([value, alwaysShowSpotlights]) => {
        if (isMounted) {
          setShowHomeOnboarding(
            value !== HOME_ONBOARDING_COMPLETED_VALUE ||
              (__DEV__ && alwaysShowSpotlights),
          );
        }
      })
      .catch(() => {
        // If local storage is unavailable, keep onboarding discoverable.
        if (isMounted) setShowHomeOnboarding(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const completeHomeOnboarding = useCallback(async () => {
    setShowHomeOnboarding(false);

    try {
      await SecureStore.setItemAsync(
        HOME_ONBOARDING_STORAGE_KEY,
        HOME_ONBOARDING_COMPLETED_VALUE,
      );
    } catch {
      // The route can still be used; onboarding will be shown again next time.
      console.warn("Could not persist home onboarding completion");
    }
  }, []);

  const headerActions = [
    {
      id: "expense",
      label: "Expense",
      accessibilityLabel: "Create expense",
      icon: Add,
      onPress: () => router.push("/expenses/create"),
    },
    {
      id: "groups",
      label: "Groups",
      accessibilityLabel: "View groups",
      icon: UserGroup03Icon,
      onPress: () =>
        router.push({
          pathname: "/groups",
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
          pathname: "/expenses",
          params: { sort: "desc", status: "active" },
        }),
    },
    {
      id: "more",
      label: "More",
      accessibilityLabel: "More settings",
      icon: MoreHorizontal,
      onPress: () => router.push("/settings"),
    },
  ] satisfies readonly HeaderCardAction[];

  if (isLoading || showHomeOnboarding === null) return <DashboardLoading />;

  if (showHomeOnboarding) {
    return <MockHome onComplete={completeHomeOnboarding} />;
  }

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
        onPress={() => router.push("/scan")}
      >
        <HugeiconsIcon icon={Scan} size={28} color="#FFFFFF" />
      </Button>
    </View>
  );
}
