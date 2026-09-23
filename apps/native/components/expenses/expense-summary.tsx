import { expenseCategories } from "@zius/api/expense-categories";
import { Icon } from "@/components/icon";
import { resolveExpenseIcon } from "@/utils/expenses/expense-categories";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { Split, UserGroup03Icon } from "@hugeicons/core-free-icons";
import { Avatar, Separator, Switch, Typography } from "heroui-native";
import { View } from "react-native";

import { formatCurrency } from "@/utils";

export type ExpenseDetails = inferRouterOutputs<AppRouter>["expense"]["get"];
export type ExpenseParticipantStatus = ExpenseDetails["participants"][number]["status"];

type ExpenseMetricProps = {
  label: string;
  amount: number;
};

function ExpenseMetric({ label, amount }: ExpenseMetricProps) {
  return (
    <View className="flex-1 gap-2 rounded-2xl bg-contrast-gradient p-4">
      <Typography className="text-sm text-on-ink-supporting">{label}</Typography>
      <Typography
        selectable
        className="text-2xl font-semibold tabular-nums text-on-ink"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {formatCurrency(amount)}
      </Typography>
    </View>
  );
}

function splitMethodLabel(splitMethod: ExpenseDetails["splitMethod"]) {
  switch (splitMethod) {
    case "equal":
      return "Equal";
    case "fixed":
      return "Exact";
    case "percentage":
      return "Percentage";
    case "items":
      return "Items";
  }
}

function expenseStatusLabel(status: ExpenseDetails["status"]) {
  switch (status) {
    case "active":
      return "Unsettled";
    case "settled":
      return "Settled";
    case "cancelled":
      return "Cancelled";
  }
}

function ParticipantAvatar({
  name,
  image,
  className = "size-8 bg-page",
  fallbackClassName = "text-xs text-ink",
}: {
  name: string;
  image: string | null | undefined;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className} size="sm" alt={name}>
      {image ? <Avatar.Image source={{ uri: image }} /> : null}
      <Avatar.Fallback>
        <Typography className={fallbackClassName}>{name.slice(0, 1).toUpperCase()}</Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}

export function ExpenseOverview({ expense }: { expense: ExpenseDetails }) {
  const payer = expense.participants.find((participant) => participant.id === expense.payerId);

  return (
    <View className="gap-4">
      <View className="flex-row gap-2">
        <ExpenseMetric label="Total Amount" amount={expense.totalMinor} />
        <ExpenseMetric
          label={expense.isPayer ? "You’re owed" : "You owe"}
          amount={expense.amountMinor}
        />
      </View>

      <View className="rounded-2xl bg-panel p-4">
        <View className="flex-row items-center">
          <View className="flex-1 items-center gap-1">
            <ParticipantAvatar
              name={expense.payerName}
              image={payer?.image}
              className="size-12 bg-page"
              fallbackClassName="text-sm text-ink"
            />
            <Typography selectable className="text-xs text-ink" numberOfLines={1}>
              {expense.payerName}
            </Typography>
          </View>

          <View className="flex-1 items-center gap-1">
            <View className="size-12 items-center justify-center rounded-full bg-page">
              <Icon icon={Split} size={24} colorClassName="accent-ink" />
            </View>
            <Typography className="text-xs" numberOfLines={1}>
              {splitMethodLabel(expense.splitMethod)}
            </Typography>
          </View>

          <View className="flex-1 items-center gap-1">
            <View className="size-12 items-center justify-center rounded-full bg-page">
              <Icon icon={UserGroup03Icon} size={24} colorClassName="accent-ink" />
            </View>
            <Typography className="text-xs" numberOfLines={1}>
              {expense.groupId ? expense.groupName : "Standalone"}
            </Typography>
          </View>

          <View className="flex-1 items-center gap-1">
            <View className="size-12 items-center justify-center rounded-full bg-page">
              <Icon
                icon={resolveExpenseIcon(expense.iconName)}
                size={24}
                colorClassName="accent-ink"
              />
            </View>
            <Typography className="text-xs" numberOfLines={1}>
              {expenseCategories[expense.category].label}
            </Typography>
          </View>
        </View>
      </View>
    </View>
  );
}

type ExpenseSummaryProps = {
  expense: ExpenseDetails;
  participantStatuses: Record<string, ExpenseParticipantStatus>;
  isSettling: boolean;
  isDisabled: boolean;
  onStatusChange: (participantId: string, status: ExpenseParticipantStatus) => void;
};

export function ExpenseSummary({
  expense,
  participantStatuses,
  isSettling,
  isDisabled,
  onStatusChange,
}: ExpenseSummaryProps) {
  const hasItems = expense.splitMethod === "items";

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Typography className="text-sm text-ink">Expense Summary</Typography>
        <Typography className="text-xs text-muted">{expenseStatusLabel(expense.status)}</Typography>
      </View>
      <View className="gap-2 rounded-2xl bg-panel p-4">
        {expense.participants.map((participant, index) => {
          const isPaid = (participantStatuses[participant.id] ?? participant.status) === "paid";
          const assignedItems = hasItems
            ? expense.items.filter((item) => item.assignedParticipantId === participant.id)
            : [];

          return (
            <View key={participant.id} className="gap-2">
              {index > 0 ? (
                <Separator className="border-t border-dashed border-border bg-transparent" />
              ) : null}
              <View className="flex-row items-center justify-between gap-2">
                <View className="min-w-0 flex-1 gap-2">
                  <View className="flex-row items-center gap-1">
                    <ParticipantAvatar name={participant.name} image={participant.image} />
                    <Typography selectable className="shrink text-sm text-ink" numberOfLines={1}>
                      {participant.name}
                    </Typography>
                    {isPaid && !isSettling ? (
                      <View className="rounded-full bg-ink px-2 py-0.5">
                        <Typography className="text-xs text-on-ink">Paid</Typography>
                      </View>
                    ) : null}
                  </View>

                  {assignedItems.length > 0 ? (
                    <View className="flex-row flex-wrap gap-1">
                      {assignedItems.map((item) => (
                        <View key={item.id} className="rounded-full bg-page px-2 py-1">
                          <Typography selectable className="text-xs text-ink" numberOfLines={1}>
                            {`${item.quantity}x ${item.name}`}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>

                <View className="shrink-0 flex-row items-center gap-2">
                  <Typography selectable className="text-sm font-semibold tabular-nums text-ink">
                    {formatCurrency(participant.owedMinor)}
                  </Typography>
                  {isSettling ? (
                    <Switch
                      accessibilityLabel={`${participant.name} paid`}
                      isSelected={isPaid}
                      isDisabled={isDisabled}
                      onSelectedChange={(isSelected) =>
                        onStatusChange(participant.id, isSelected ? "paid" : "unpaid")
                      }
                    />
                  ) : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
