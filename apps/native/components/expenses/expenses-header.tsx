import { Typography } from "heroui-native";
import { View } from "react-native";

import {
  ExpenseFilters,
  type ExpenseSort,
  type ExpenseStatus,
} from "@/components/expenses/expense-filters";

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
  return (
    <View className="gap-2 pt-safe pb-2">
      <View className="flex-row items-center justify-between gap-4 py-4">
        <Typography className="text-2xl font-semibold text-ink">History</Typography>
        <ExpenseFilters status={status} sort={sort} />
      </View>
      <Typography className="text-sm text-ink">{getExpensesSubtitle({ status, sort })}</Typography>
    </View>
  );
}
