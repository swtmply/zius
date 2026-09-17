import { useRouter } from "@/utils/navigation";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { ExpenseCard, type DashboardExpense } from "@/components/expenses/expense-card";

export function ExpensesEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View className="bg-panel rounded-2xl p-4 gap-4 items-center">
      <Typography className="text-sm font-semibold text-ink text-center">{title}</Typography>
      <Typography className="text-xs text-supporting text-center">{description}</Typography>
    </View>
  );
}

export function DashboardExpenses({
  expenses,
  settled = false,
}: {
  expenses: DashboardExpense[];
  settled?: boolean;
}) {
  const router = useRouter();
  return (
    <>
      <View className="flex-row items-center justify-between gap-4">
        <Typography className="text-ink">
          {settled ? "Settled Expenses" : "Unsettled Expenses"}
        </Typography>
        <Button
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: "/expenses",
              params: { sort: "desc", status: settled ? "settled" : "active" },
            })
          }
        >
          <Typography className="text-sm text-supporting">See All</Typography>
        </Button>
      </View>
      <View className="gap-2">
        {expenses.length === 0 ? (
          <ExpensesEmptyState
            title={settled ? "No settled expenses" : "No unsettled expenses"}
            description={
              settled
                ? "Fully paid expenses will appear here."
                : "Expenses with outstanding payments will appear here."
            }
          />
        ) : (
          expenses.map((item) => (
            <ExpenseCard
              key={item.id}
              expense={item}
              onPress={() =>
                router.push({
                  pathname: "/expenses/[expenseId]",
                  params: { expenseId: item.id },
                })
              }
            />
          ))
        )}
      </View>
    </>
  );
}
