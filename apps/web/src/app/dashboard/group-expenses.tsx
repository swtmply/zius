import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add } from "@hugeicons/core-free-icons";

import { ExpenseCard, type ExpenseCardExpense } from "./expense-card";
import type { Route } from "next";

export function GroupExpensesSection({
  title,
  emptyMessage,
  expenses,
  addExpenseHref,
}: {
  title: string;
  emptyMessage: string;
  expenses: ExpenseCardExpense[];
  addExpenseHref?: Route;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm text-ink">{title}</h2>
        {addExpenseHref ? (
          <Link
            href={addExpenseHref}
            className="inline-flex h-8 items-center gap-2 rounded-full bg-ink px-3 text-xs font-medium text-on-dark"
          >
            <HugeiconsIcon icon={Add} size={16} />
            Add Expense
          </Link>
        ) : null}
      </div>
      {expenses.length > 0 ? (
        <div className="space-y-2">
          {expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      ) : (
        <div className="panel text-center text-xs text-supporting">{emptyMessage}</div>
      )}
    </section>
  );
}
