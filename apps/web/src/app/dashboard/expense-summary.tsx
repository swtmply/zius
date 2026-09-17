import type { ReactNode } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { expenseCategories } from "@zius/api/expense-categories";
import { HugeiconsIcon } from "@hugeicons/react";
import { Split, UserGroup03Icon } from "@hugeicons/core-free-icons";

import { Avatar } from "./avatar";
import { resolveExpenseIcon } from "./expense-icons";
import { formatCurrency } from "./format";
import { Switch } from "./switch";

export type ExpenseDetailsData = inferRouterOutputs<AppRouter>["expense"]["get"];
export type ExpenseParticipantStatus = ExpenseDetailsData["participants"][number]["status"];

function ExpenseMetric({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="min-w-0 flex-1 space-y-2 rounded-2xl bg-contrast-gradient p-4">
      <p className="text-sm text-on-ink-supporting">{label}</p>
      <p className="truncate text-2xl font-semibold tabular-nums text-on-ink">
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

function OverviewTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      {children}
      <span className="w-full truncate text-center text-xs text-ink">{label}</span>
    </div>
  );
}

function splitMethodLabel(splitMethod: ExpenseDetailsData["splitMethod"]) {
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

function expenseStatusLabel(status: ExpenseDetailsData["status"]) {
  switch (status) {
    case "active":
      return "Unsettled";
    case "settled":
      return "Settled";
    case "cancelled":
      return "Cancelled";
  }
}

export function ExpenseOverview({ expense }: { expense: ExpenseDetailsData }) {
  const payer = expense.participants.find((participant) => participant.id === expense.payerId);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <ExpenseMetric label="Total Amount" amount={expense.totalMinor} />
        <ExpenseMetric
          label={expense.isPayer ? "You’re owed" : "You owe"}
          amount={expense.amountMinor}
        />
      </div>

      <div className="panel flex items-start">
        <OverviewTile label={expense.payerName}>
          <Avatar
            person={{ name: expense.payerName, image: payer?.image }}
            className="size-12 text-sm"
          />
        </OverviewTile>
        <OverviewTile label={splitMethodLabel(expense.splitMethod)}>
          <span className="flex size-12 items-center justify-center rounded-full bg-page">
            <HugeiconsIcon icon={Split} size={24} />
          </span>
        </OverviewTile>
        <OverviewTile label={expense.groupId ? (expense.groupName ?? "Group") : "Standalone"}>
          <span className="flex size-12 items-center justify-center rounded-full bg-page">
            <HugeiconsIcon icon={UserGroup03Icon} size={24} />
          </span>
        </OverviewTile>
        <OverviewTile label={expenseCategories[expense.category].label}>
          <span className="flex size-12 items-center justify-center rounded-full bg-page">
            <HugeiconsIcon icon={resolveExpenseIcon(expense.iconName)} size={24} />
          </span>
        </OverviewTile>
      </div>
    </div>
  );
}

export function ExpenseSummary({
  expense,
  participantStatuses,
  isSettling,
  isDisabled,
  onStatusChange,
}: {
  expense: ExpenseDetailsData;
  participantStatuses: Record<string, ExpenseParticipantStatus>;
  isSettling: boolean;
  isDisabled: boolean;
  onStatusChange: (participantId: string, status: ExpenseParticipantStatus) => void;
}) {
  const hasItems = expense.splitMethod === "items";

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm text-ink">Expense Summary</h2>
        <span className="text-xs text-supporting">{expenseStatusLabel(expense.status)}</span>
      </div>
      <div className="panel space-y-2">
        {expense.participants.map((participant, index) => {
          const isPaid = (participantStatuses[participant.id] ?? participant.status) === "paid";
          const assignedItems = hasItems
            ? expense.items.filter((item) => item.assignedParticipantId === participant.id)
            : [];

          return (
            <div key={participant.id} className="space-y-2">
              {index > 0 ? <div className="dashed-divider" /> : null}
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-1">
                    <Avatar person={participant} />
                    <span className="min-w-0 truncate text-sm text-ink">{participant.name}</span>
                    {isPaid && !isSettling ? (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-on-ink">
                        Paid
                      </span>
                    ) : null}
                  </div>

                  {assignedItems.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {assignedItems.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-full bg-page px-2 py-1 text-xs text-ink"
                        >
                          {item.quantity}x {item.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-ink">
                    {formatCurrency(participant.owedMinor, expense.currency)}
                  </span>
                  {isSettling ? (
                    <Switch
                      label={`${participant.name} paid`}
                      isSelected={isPaid}
                      isDisabled={isDisabled}
                      onSelectedChange={(isSelected) =>
                        onStatusChange(participant.id, isSelected ? "paid" : "unpaid")
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
