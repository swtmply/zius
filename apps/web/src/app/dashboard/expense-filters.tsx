"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { SlidersVertical } from "@hugeicons/core-free-icons";

import { OptionPills } from "./option-pills";
import { dashboardRoutes, withQuery } from "./routes";
import { Sheet } from "./sheet";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "settled", label: "Settled" },
  { value: "cancelled", label: "Cancelled" },
] as const;
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;

export type ExpenseStatus = (typeof statusOptions)[number]["value"];
export type ExpenseSort = (typeof sortOptions)[number]["value"];

export function useExpenseFilters() {
  const params = useSearchParams();
  const rawStatus = params.get("status") ?? params.get("type");
  const rawSort = params.get("sort");

  return {
    status: (statusOptions.some((option) => option.value === rawStatus)
      ? rawStatus
      : "active") as ExpenseStatus,
    sort: (rawSort === "oldest" || rawSort === "asc" ? "oldest" : "newest") as ExpenseSort,
  };
}

export function ExpenseFilters({ status, sort }: { status: ExpenseStatus; sort: ExpenseSort }) {
  const router = useRouter();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ExpenseStatus>(status);
  const [draftSort, setDraftSort] = useState<ExpenseSort>(sort);

  return (
    <>
      <button
        type="button"
        aria-label="Open expense filters"
        className="icon-button bg-dark-gradient text-on-dark hover:bg-dark-gradient"
        onClick={() => {
          setDraftStatus(status);
          setDraftSort(sort);
          setIsFiltersOpen(true);
        }}
      >
        <HugeiconsIcon icon={SlidersVertical} size={22} />
      </button>
      <Sheet isOpen={isFiltersOpen} onOpenChange={setIsFiltersOpen} title="Filters">
        <OptionPills
          label="Status"
          options={statusOptions}
          value={draftStatus}
          onChange={setDraftStatus}
        />
        <OptionPills label="Sort" options={sortOptions} value={draftSort} onChange={setDraftSort} />
        <button
          type="button"
          className="action w-full bg-dark-gradient"
          onClick={() => {
            router.replace(
              withQuery(dashboardRoutes.expenses, { status: draftStatus, sort: draftSort }),
            );
            setIsFiltersOpen(false);
          }}
        >
          Submit
        </button>
      </Sheet>
    </>
  );
}
