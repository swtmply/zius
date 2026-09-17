import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { Add, ShoppingBasket01Icon } from "@hugeicons/core-free-icons";
import { Button, PressableFeedback, Separator, Typography } from "heroui-native";
import { View } from "react-native";
import { useRouter } from "@/utils/navigation";

import { Icon } from "@/components/icon";
import { GroupAvatar } from "@/components/groups/group-avatar";

type Group = inferRouterOutputs<AppRouter>["group"]["get"];

export function GroupParticipants({
  participants,
  folded,
}: {
  participants: Group["participants"];
  folded: boolean;
}) {
  return (
    <View className="rounded-2xl bg-panel p-4">
      <View className={folded ? "flex-row flex-wrap items-center justify-start gap-1" : "gap-2"}>
        {participants.map((person) =>
          folded ? (
            <GroupAvatar key={person.id} person={person} className="size-8 bg-page" />
          ) : (
            <View key={person.id} className="flex-row items-center gap-2">
              <GroupAvatar person={person} className="size-8 bg-page" />
              <Typography className="text-sm text-ink shrink" selectable numberOfLines={1}>
                {person.name}
              </Typography>
              {!person.userId && (
                <View className="rounded-full bg-page px-2 py-1">
                  <Typography className="text-[10px] text-supporting">Guest</Typography>
                </View>
              )}
            </View>
          ),
        )}
      </View>
    </View>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export function GroupExpenseCard({ expense }: { expense: Group["expenses"][number] }) {
  const router = useRouter();
  const isCancelled = expense.status === "cancelled";
  const amount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: expense.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(expense.totalMinor / 100);
  const visibleParticipants = expense.participants.slice(0, 3);
  const remaining = expense.participants.length - visibleParticipants.length;

  const content = (
    <View className={`gap-2 rounded-2xl bg-panel p-4${isCancelled ? " opacity-70" : ""}`}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="size-10 items-center justify-center rounded-full bg-page">
          <Icon icon={ShoppingBasket01Icon} size={18} colorClassName="accent-ink" />
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
              {dateFormatter.format(new Date(expense.occurredAt))}
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
          {amount}
        </Typography>
      </View>

      <Separator className="border-t border-dashed border-border bg-transparent" />

      <View className="flex-row items-center gap-1">
        {visibleParticipants.map((person) => (
          <View key={person.id} className="rounded-full border-2 border-panel">
            <GroupAvatar person={person} className="size-8 bg-page" />
          </View>
        ))}
        {remaining > 0 ? (
          <View
            className="size-8 items-center justify-center rounded-full border-2 border-panel bg-page"
            accessibilityLabel={`${remaining} more participants`}
          >
            <Typography className="text-xs text-ink">{remaining}+</Typography>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <PressableFeedback
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${amount}${isCancelled ? ", Cancelled" : ""}`}
      onPress={() =>
        router.push({
          pathname: "/expenses/[expenseId]",
          params: { expenseId: expense.id },
        })
      }
    >
      {content}
    </PressableFeedback>
  );
}

export function GroupExpensesSection({
  title,
  emptyMessage,
  expenses,
  onAddExpense,
}: {
  title: string;
  emptyMessage: string;
  expenses: Group["expenses"];
  onAddExpense?: () => void;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-4">
        <Typography className="text-sm text-ink">{title}</Typography>
        {onAddExpense ? (
          <Button
            size="sm"
            className="h-8 gap-2 rounded-full px-3"
            accessibilityLabel="Add expense"
            onPress={onAddExpense}
          >
            <Icon icon={Add} size={16} colorClassName="accent-on-ink" />
            <Button.Label className="text-xs">Add Expense</Button.Label>
          </Button>
        ) : null}
      </View>
      {expenses.length > 0 ? (
        <View className="gap-2">
          {expenses.map((expense) => (
            <GroupExpenseCard key={expense.id} expense={expense} />
          ))}
        </View>
      ) : (
        <View className="items-center rounded-2xl bg-panel p-4">
          <Typography className="text-xs text-supporting">{emptyMessage}</Typography>
        </View>
      )}
    </View>
  );
}
