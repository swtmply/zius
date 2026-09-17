import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { Icon } from "@/components/icon";
import { resolveExpenseIcon } from "@/utils/expenses/expense-categories";
import { Avatar, PressableFeedback, Separator, Typography } from "heroui-native";
import { View } from "react-native";

import { formatCurrency } from "@/utils";

export type DashboardExpense =
  inferRouterOutputs<AppRouter>["dashboard"]["get"]["activeExpenses"][number];
export type HistoryExpense = inferRouterOutputs<AppRouter>["expense"]["list"]["items"][number];
export type ExpenseCardExpense = DashboardExpense | HistoryExpense;

export interface ExpenseCardProps {
  expense: ExpenseCardExpense;
  onPress?: () => void;
}

const expenseDateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

function ExpenseCardContent({ expense }: { expense: ExpenseCardExpense }) {
  const isCancelled = expense.status === "cancelled";
  const visibleParticipants = expense.participants.slice(0, 3);
  const remainingParticipants = expense.participants.length - visibleParticipants.length;

  return (
    <View className={`bg-panel rounded-2xl p-4 gap-2${isCancelled ? " opacity-70" : ""}`}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="size-10 rounded-full bg-page items-center justify-center">
          <Icon icon={resolveExpenseIcon(expense.iconName)} size={18} colorClassName="accent-ink" />
        </View>
        <View className="flex-1 gap-1">
          <Typography
            selectable
            className={`text-sm text-ink${isCancelled ? " text-supporting" : ""}`}
            numberOfLines={1}
          >
            {expense.title}
          </Typography>
          <View className="flex-row items-center gap-2">
            <Typography className="text-xs text-supporting">
              {expenseDateFormatter.format(new Date(expense.occurredAt))}
            </Typography>
            {isCancelled ? (
              <View className="rounded-full bg-page px-2 py-1">
                <Typography className="text-[10px] text-supporting">Cancelled</Typography>
              </View>
            ) : null}
          </View>
        </View>
        <Typography
          selectable
          className={`text-sm font-semibold text-ink${isCancelled ? " text-supporting line-through" : ""}`}
          adjustsFontSizeToFit
          numberOfLines={1}
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {formatCurrency(expense.totalMinor)}
        </Typography>
      </View>

      <Separator className="border-t border-dashed border-border bg-transparent" />

      <View className="flex-row items-center gap-1">
        {visibleParticipants.map((participant) => (
          <View key={participant.id} className="rounded-full border-2 border-panel">
            <Avatar className="size-8 bg-page" size="sm" alt={participant.name}>
              {participant.image ? <Avatar.Image source={{ uri: participant.image }} /> : null}
              <Avatar.Fallback>
                <Typography className="text-xs text-ink">
                  {participant.name.slice(0, 1).toUpperCase()}
                </Typography>
              </Avatar.Fallback>
            </Avatar>
          </View>
        ))}
        {remainingParticipants > 0 ? (
          <View
            className="size-8 items-center justify-center rounded-full border-2 border-panel bg-page"
            accessibilityLabel={`${remainingParticipants} more participants`}
          >
            <Typography className="text-xs text-ink">{remainingParticipants}+</Typography>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const content = <ExpenseCardContent expense={expense} />;

  return onPress ? (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${formatCurrency(expense.totalMinor)}${expense.status === "cancelled" ? ", Cancelled" : ""}`}
      onPress={onPress}
    >
      {content}
    </PressableFeedback>
  ) : (
    content
  );
}
