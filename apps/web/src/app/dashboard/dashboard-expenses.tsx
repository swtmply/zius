import Link from "next/link";

import { EmptyState } from "./empty-state";
import { ExpenseCard, type ExpenseCardExpense } from "./expense-card";
import { dashboardRoutes, withQuery } from "./routes";

export function DashboardExpenses({
  expenses,
  settled = false,
}: {
  expenses: ExpenseCardExpense[];
  settled?: boolean;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-ink">{settled ? "Settled Expenses" : "Unsettled Expenses"}</h2>
        <Link
          href={withQuery(dashboardRoutes.expenses, {
            sort: "newest",
            status: settled ? "settled" : "active",
          })}
          className="flex min-h-11 items-center text-sm text-supporting"
        >
          See All
        </Link>
      </div>
      <div className="space-y-2">
        {expenses.length === 0 ? (
          <EmptyState
            title={settled ? "No settled expenses" : "No unsettled expenses"}
            description={
              settled
                ? "Fully paid expenses will appear here."
                : "Expenses with outstanding payments will appear here."
            }
          />
        ) : (
          expenses.map((expense) => <ExpenseCard key={expense.id} expense={expense} />)
        )}
      </div>
    </section>
  );
}
