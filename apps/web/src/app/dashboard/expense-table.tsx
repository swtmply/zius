"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import {
  Airplane01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Car01Icon,
  FilterHorizontalIcon,
  GlassWaterIcon,
  ReceiptTextIcon,
  Restaurant01Icon,
  Search01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@zius/ui/components/button";
import { Checkbox } from "@zius/ui/components/checkbox";
import { Input } from "@zius/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@zius/ui/components/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zius/ui/components/table";
import { useState } from "react";

import { expenseCategories } from "@zius/api/expense-categories";
import type { AppRouter } from "@zius/api/routers/index";
import { trpc } from "@/utils/trpc";

type Expense = inferRouterOutputs<AppRouter>["expense"]["list"]["items"][number];
type FacetKey = "category" | "payer" | "group" | "status";
type FacetSelection = Record<FacetKey, string[]>;
type SortKey = "createdAt" | "totalMinor";

const NO_GROUP = "__no_group__";
const statusLabels = {
  active: "Active",
  settled: "Settled",
  cancelled: "Cancelled",
} as const;
const categoryIcons = {
  food: Restaurant01Icon,
  transportation: Car01Icon,
  travel: Airplane01Icon,
  drinks: GlassWaterIcon,
  shopping: ShoppingBag01Icon,
  others: ReceiptTextIcon,
};
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function getPayerName(expense: Expense) {
  return expense.payerName || expense.participants[0]?.name || "Unknown";
}

function getFacetValue(expense: Expense, key: FacetKey) {
  switch (key) {
    case "category":
      return expense.category;
    case "payer":
      return getPayerName(expense);
    case "group":
      return expense.groupName ?? NO_GROUP;
    case "status":
      return expense.status;
  }
}

function getFacetLabel(key: FacetKey, value: string) {
  if (key === "category") {
    return expenseCategories[value as keyof typeof expenseCategories].label;
  }

  if (key === "status") {
    return statusLabels[value as keyof typeof statusLabels];
  }

  return key === "group" && value === NO_GROUP ? "No group" : value;
}

function getFacetOptions(expenses: Expense[], key: FacetKey) {
  const counts = new Map<string, number>();

  for (const expense of expenses) {
    const value = getFacetValue(expense, key);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: getFacetLabel(key, value), count }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function formatCurrency(minor: number, currency: string) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  }).format(minor / 100);
}

function FacetedFilter({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: Array<{ value: string; label: string; count: number }>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button variant="outline" size="sm" className="gap-2 bg-background font-normal" />}
      >
        <HugeiconsIcon icon={FilterHorizontalIcon} size={14} strokeWidth={1.8} />
        {label}
        {selected.length > 0 ? (
          <span className="ml-0.5 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {selected.length}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 gap-0 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="font-medium">Filter by {label.toLowerCase()}</span>
          {selected.length > 0 ? (
            <button
              type="button"
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              onClick={() => selected.forEach(onToggle)}
            >
              Clear
            </button>
          ) : null}
        </div>
        <div className="max-h-64 overflow-y-auto p-1.5">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 hover:bg-muted"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (typeof checked === "boolean") onToggle(option.value);
                }}
                aria-label={option.label}
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{option.count}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
      onClick={onClick}
    >
      {label}
      {active ? (
        <HugeiconsIcon
          icon={direction === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
          size={13}
          strokeWidth={1.8}
        />
      ) : null}
    </button>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-10 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function ExpenseTable() {
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<FacetSelection>({
    category: [],
    payer: [],
    group: [],
    status: [],
  });
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "createdAt",
    direction: "desc",
  });
  const expensesQuery = useInfiniteQuery(
    trpc.expense.list.infiniteQueryOptions(
      { status: "all", sort: "newest", limit: 50 },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const expenses = expensesQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredExpenses = expenses
    .filter((expense) => {
      if (normalizedSearch && !expense.title.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      return (Object.keys(selection) as FacetKey[]).every((key) => {
        const values = selection[key];
        return values.length === 0 || values.includes(getFacetValue(expense, key));
      });
    })
    .sort((a, b) => {
      const comparison =
        sort.key === "totalMinor"
          ? a.totalMinor - b.totalMinor
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort.direction === "asc" ? comparison : -comparison;
    });
  const facetOptions = {
    category: getFacetOptions(expenses, "category"),
    payer: getFacetOptions(expenses, "payer"),
    group: getFacetOptions(expenses, "group"),
    status: getFacetOptions(expenses, "status"),
  };
  const hasFilters =
    normalizedSearch.length > 0 || Object.values(selection).some((values) => values.length > 0);

  function toggleFacet(key: FacetKey, value: string) {
    setSelection((current) => {
      const values = current[key];
      return {
        ...current,
        [key]: values.includes(value)
          ? values.filter((entry) => entry !== value)
          : [...values, value],
      };
    });
  }

  function changeSort(key: SortKey) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  function clearFilters() {
    setSearch("");
    setSelection({ category: [], payer: [], group: [], status: [] });
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Expenses</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A complete view of the expenses you share with others.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredExpenses.length} of {expenses.length} expenses
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1 sm:max-w-xs">
            <HugeiconsIcon
              icon={Search01Icon}
              size={15}
              strokeWidth={1.8}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search expenses..."
              aria-label="Search expenses"
              className="h-9 pl-8"
            />
          </div>
          {facetOptions.category.length > 0 ? (
            <FacetedFilter
              label="Category"
              options={facetOptions.category}
              selected={selection.category}
              onToggle={(value) => toggleFacet("category", value)}
            />
          ) : null}
          {facetOptions.payer.length > 0 ? (
            <FacetedFilter
              label="Payer"
              options={facetOptions.payer}
              selected={selection.payer}
              onToggle={(value) => toggleFacet("payer", value)}
            />
          ) : null}
          {facetOptions.group.length > 0 ? (
            <FacetedFilter
              label="Group"
              options={facetOptions.group}
              selected={selection.group}
              onToggle={(value) => toggleFacet("group", value)}
            />
          ) : null}
          {facetOptions.status.length > 0 ? (
            <FacetedFilter
              label="Status"
              options={facetOptions.status}
              selected={selection.status}
              onToggle={(value) => toggleFacet("status", value)}
            />
          ) : null}
          {hasFilters ? (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {expensesQuery.isPending ? <TableSkeleton /> : null}
      {expensesQuery.isError ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
          <p className="text-sm font-medium">We couldn&apos;t load your expenses.</p>
          <p className="text-xs text-muted-foreground">Try again in a moment.</p>
          <Button variant="outline" size="sm" onClick={() => void expensesQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}
      {!expensesQuery.isPending && !expensesQuery.isError && filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={1.8} />
          </div>
          <p className="mt-1 text-sm font-medium">
            {hasFilters ? "No expenses match your filters" : "No expenses yet"}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {hasFilters
              ? "Try removing a filter or searching for a different expense."
              : "Expenses you create or share with others will appear here."}
          </p>
        </div>
      ) : null}
      {!expensesQuery.isPending && !expensesQuery.isError && filteredExpenses.length > 0 ? (
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[28%]">Name</TableHead>
              <TableHead>
                <SortButton
                  label="Date Created"
                  active={sort.key === "createdAt"}
                  direction={sort.direction}
                  onClick={() => changeSort("createdAt")}
                />
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">
                <span className="inline-flex w-full justify-end">
                  <SortButton
                    label="Amount"
                    active={sort.key === "totalMinor"}
                    direction={sort.direction}
                    onClick={() => changeSort("totalMinor")}
                  />
                </span>
              </TableHead>
              <TableHead>Payer Name</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div className="flex min-w-52 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <HugeiconsIcon
                        icon={categoryIcons[expense.category]}
                        size={17}
                        strokeWidth={1.8}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {expense.title}
                      </span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(expense.createdAt)}
                </TableCell>
                <TableCell>{expenseCategories[expense.category].label}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {formatCurrency(expense.totalMinor, expense.currency)}
                </TableCell>
                <TableCell>{getPayerName(expense)}</TableCell>
                <TableCell>{expense.groupName ?? ""}</TableCell>
                <TableCell>
                  <span
                    className={
                      expense.status === "cancelled"
                        ? "text-destructive"
                        : expense.status === "settled"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                    }
                  >
                    {statusLabels[expense.status]}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      {expensesQuery.hasNextPage ? (
        <div className="flex justify-center border-t p-3">
          <Button
            variant="outline"
            size="sm"
            disabled={expensesQuery.isFetchingNextPage}
            onClick={() => void expensesQuery.fetchNextPage()}
          >
            {expensesQuery.isFetchingNextPage ? "Loading..." : "Load more expenses"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
