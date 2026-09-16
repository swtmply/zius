import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingBasket01Icon } from "@hugeicons/core-free-icons";

import { AvatarStack } from "./avatar";
import { resolveExpenseIcon } from "./expense-icons";
import { formatCurrency, formatShortDate } from "./format";
import { dashboardRoutes } from "./routes";

export type ExpenseCardExpense = {
  id: string;
  title: string;
  iconName?: string;
  totalMinor: number;
  currency: string;
  occurredAt: string | Date;
  status: "active" | "settled" | "cancelled";
  participants: readonly { id: string; name: string; image: string | null }[];
};

export function ExpenseCard({ expense }: { expense: ExpenseCardExpense }) {
  const isCancelled = expense.status === "cancelled";

  return (
    <Link
      href={dashboardRoutes.expense(expense.id)}
      className={`panel block space-y-2 transition-shadow hover:shadow-md ${isCancelled ? "opacity-70" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-page">
          <HugeiconsIcon
            icon={expense.iconName ? resolveExpenseIcon(expense.iconName) : ShoppingBasket01Icon}
            size={18}
          />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className={`truncate text-sm ${isCancelled ? "text-supporting" : "text-ink"}`}>
            {expense.title}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-supporting">{formatShortDate(expense.occurredAt)}</span>
            {isCancelled ? (
              <span className="rounded-full bg-page px-2 py-1 text-[10px] text-supporting">
                Cancelled
              </span>
            ) : null}
          </div>
        </div>
        <span
          className={`shrink-0 text-sm font-semibold tabular-nums ${isCancelled ? "text-supporting line-through" : "text-ink"}`}
        >
          {formatCurrency(expense.totalMinor, expense.currency)}
        </span>
      </div>

      <div className="dashed-divider" />

      <AvatarStack people={expense.participants} />
    </Link>
  );
}
