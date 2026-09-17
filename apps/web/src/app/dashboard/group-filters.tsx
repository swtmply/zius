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
  { value: "archived", label: "Archived" },
] as const;
const typeOptions = [
  { value: "all", label: "All" },
  { value: "owner", label: "Owner" },
  { value: "member", label: "Member" },
] as const;
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;

export type GroupStatus = (typeof statusOptions)[number]["value"];
export type GroupType = (typeof typeOptions)[number]["value"];
export type GroupSort = (typeof sortOptions)[number]["value"];

export function useGroupFilters() {
  const params = useSearchParams();
  const rawStatus = params.get("status");
  const rawType = params.get("type");
  const rawSort = params.get("sort");

  return {
    status: (rawStatus === "archived" || rawStatus === "all" ? rawStatus : "active") as GroupStatus,
    type: (rawType === "owner" || rawType === "member" ? rawType : "all") as GroupType,
    sort: (rawSort === "oldest" || rawSort === "asc" ? "oldest" : "newest") as GroupSort,
  };
}

export function GroupFilters({
  status,
  type,
  sort,
}: {
  status: GroupStatus;
  type: GroupType;
  sort: GroupSort;
}) {
  const router = useRouter();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<GroupStatus>(status);
  const [draftType, setDraftType] = useState<GroupType>(type);
  const [draftSort, setDraftSort] = useState<GroupSort>(sort);

  return (
    <>
      <button
        type="button"
        aria-label="Open group filters"
        className="icon-button bg-contrast-gradient text-on-ink hover:bg-contrast-gradient"
        onClick={() => {
          setDraftStatus(status);
          setDraftType(type);
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
        <OptionPills label="Type" options={typeOptions} value={draftType} onChange={setDraftType} />
        <OptionPills label="Sort" options={sortOptions} value={draftSort} onChange={setDraftSort} />
        <button
          type="button"
          className="action w-full bg-contrast-gradient"
          onClick={() => {
            router.replace(
              withQuery(dashboardRoutes.groups, {
                status: draftStatus,
                type: draftType,
                sort: draftSort,
              }),
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
