"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add } from "@hugeicons/core-free-icons";

import { trpc } from "@/utils/trpc";

import { EmptyState } from "./empty-state";
import { GroupCard } from "./group-card";
import {
  GroupFilters,
  useGroupFilters,
  type GroupSort,
  type GroupStatus,
  type GroupType,
} from "./group-filters";
import { GroupsLoading } from "./groups-loading";
import { ListFooter } from "./list-footer";
import { dashboardRoutes } from "./routes";
import { ScreenHeader } from "./screen-header";

function getGroupsSubtitle({
  status,
  sort,
  type,
}: {
  status: GroupStatus;
  sort: GroupSort;
  type: GroupType;
}) {
  const sortLabel = sort === "newest" ? "Newest" : "Oldest";
  const statusLabel = status === "active" ? "Active" : status === "archived" ? "Archived" : "All";
  const typeLabel = type === "owner" ? " You Own" : type === "member" ? " Shared With You" : "";

  return `${sortLabel} ${statusLabel} Groups${typeLabel}`;
}

export function GroupsPage() {
  const { status, type, sort } = useGroupFilters();
  const query = useInfiniteQuery(
    trpc.group.list.infiniteQueryOptions(
      { type: type === "all" ? undefined : type, sort, status },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const groups = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-3">
      <div className="space-y-2 pb-2">
        <ScreenHeader backHref={dashboardRoutes.home} title="Groups">
          <div className="flex items-center gap-2">
            <Link
              href={dashboardRoutes.createGroup}
              aria-label="Create group"
              className="icon-button"
            >
              <HugeiconsIcon icon={Add} size={24} />
            </Link>
            <GroupFilters status={status} type={type} sort={sort} />
          </div>
        </ScreenHeader>
        <p className="text-sm text-ink">{getGroupsSubtitle({ status, sort, type })}</p>
      </div>

      {query.isPending ? <GroupsLoading /> : null}

      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      ) : !query.isPending && !query.isError ? (
        <EmptyState title="No groups" description="No groups match these filters." />
      ) : null}

      <ListFooter
        hasItems={groups.length > 0}
        hasNextPage={query.hasNextPage}
        isError={query.isError}
        isFetchNextPageError={query.isFetchNextPageError}
        isFetchingNextPage={query.isFetchingNextPage}
        errorMessage="Unable to load groups."
        loadingSlot={<GroupsLoading count={2} />}
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
