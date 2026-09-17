import { ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { Icon } from "@/components/icon";
import {
  ExpenseFilters,
  type ExpenseSort,
  type ExpenseStatus,
} from "@/components/expenses/expense-filters";
import { useRouter } from "@/utils/navigation";

function getExpensesSubtitle({ status, sort }: { status: ExpenseStatus; sort: ExpenseSort }) {
  const sortLabel = sort === "newest" ? "Newest" : "Oldest";
  const statusLabel =
    status === "active"
      ? "Active"
      : status === "settled"
        ? "Settled"
        : status === "cancelled"
          ? "Cancelled"
          : "All";

  return `${sortLabel} ${statusLabel} Expenses`;
}

export function ExpensesHeader({ status, sort }: { status: ExpenseStatus; sort: ExpenseSort }) {
  const router = useRouter();

  return (
    <View className="gap-2 pt-safe pb-2">
      <View className="flex-row items-center justify-between gap-4 py-4">
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
        >
          <Icon icon={ChevronLeftFreeIcons} size={24} colorClassName="accent-ink" />
        </Button>
        <Typography className="flex-1 text-2xl font-semibold text-ink">History</Typography>
        <ExpenseFilters status={status} sort={sort} />
      </View>
      <Typography className="text-sm text-ink">{getExpensesSubtitle({ status, sort })}</Typography>
    </View>
  );
}
