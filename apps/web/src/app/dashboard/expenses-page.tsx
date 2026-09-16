"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

import { EmptyState } from "./empty-state";
import { ExpenseCard } from "./expense-card";
import {
  ExpenseFilters,
  useExpenseFilters,
  type ExpenseSort,
  type ExpenseStatus,
} from "./expense-filters";
import { ExpenseListLoading } from "./home-loading";
import { ListFooter } from "./list-footer";
import { dashboardRoutes } from "./routes";
import { ScreenHeader } from "./screen-header";

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

export function ExpensesPage() {
  const { status, sort } = useExpenseFilters();
  const query = useInfiniteQuery(
    trpc.expense.list.infiniteQueryOptions(
      { status, sort },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const expenses = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-3">
      <div className="space-y-2 pb-2">
        <ScreenHeader backHref={dashboardRoutes.home} title="History">
          <ExpenseFilters status={status} sort={sort} />
        </ScreenHeader>
        <p className="text-sm text-ink">{getExpensesSubtitle({ status, sort })}</p>
      </div>

      {query.isPending ? <ExpenseListLoading /> : null}

      {expenses.length > 0 ? (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      ) : !query.isPending && !query.isError ? (
        <EmptyState title="No expenses" description="No expenses match these filters." />
      ) : null}

      <ListFooter
        hasItems={expenses.length > 0}
        hasNextPage={query.hasNextPage}
        isError={query.isError}
        isFetchNextPageError={query.isFetchNextPageError}
        isFetchingNextPage={query.isFetchingNextPage}
        errorMessage="Unable to load expenses."
        loadingSlot={<ExpenseListLoading count={2} />}
        onLoadMore={() => {
          void query.fetchNextPage();
        }}
        onRetry={() => {
          if (query.isFetchNextPageError) void query.fetchNextPage();
          else void query.refetch();
        }}
      />
    </div>
  );
}
