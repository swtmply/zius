"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { Search01Icon, UserGroup03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@zius/ui/components/badge";
import { Button } from "@zius/ui/components/button";
import { Input } from "@zius/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zius/ui/components/table";
import { useState } from "react";

import type { AppRouter } from "@zius/api/routers/index";
import { trpc } from "@/utils/trpc";

type Group = inferRouterOutputs<AppRouter>["group"]["list"]["items"][number];

const groupTypeLabels = {
  owner: "Owner",
  member: "Member",
} as const;
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function GroupTableSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <div className="space-y-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-10 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

function memberSummary(group: Group) {
  const names = group.participants.slice(0, 3).map((participant) => participant.name);
  const remaining = group.participants.length - names.length;
  return remaining > 0 ? `${names.join(", ")} +${remaining}` : names.join(", ");
}

export function GroupTable() {
  const [search, setSearch] = useState("");
  const groupsQuery = useInfiniteQuery(
    trpc.group.list.infiniteQueryOptions(
      { status: "all", sort: "newest", limit: 50 },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const groups = groupsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredGroups = groups.filter(
    (group) =>
      !normalizedSearch ||
      group.name.toLowerCase().includes(normalizedSearch) ||
      group.participants.some((participant) =>
        participant.name.toLowerCase().includes(normalizedSearch),
      ),
  );

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight">Groups</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Shared spaces for the people and expenses you track together.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {filteredGroups.length} of {groups.length} groups
          </span>
        </div>

        <div className="relative max-w-xs">
          <HugeiconsIcon
            icon={Search01Icon}
            size={15}
            strokeWidth={1.8}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search groups..."
            aria-label="Search groups"
            className="h-9 pl-8"
          />
        </div>
      </div>

      {groupsQuery.isPending ? <GroupTableSkeleton /> : null}
      {groupsQuery.isError ? (
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center" role="alert">
          <p className="text-sm font-medium">We couldn&apos;t load your groups.</p>
          <p className="text-xs text-muted-foreground">Try again in a moment.</p>
          <Button variant="outline" size="sm" onClick={() => void groupsQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}
      {!groupsQuery.isPending && !groupsQuery.isError && filteredGroups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={UserGroup03Icon} size={18} strokeWidth={1.8} />
          </div>
          <p className="mt-1 text-sm font-medium">
            {normalizedSearch ? "No groups match your search" : "No groups yet"}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {normalizedSearch
              ? "Try searching for a different group or member."
              : "Groups you create or join will appear here."}
          </p>
        </div>
      ) : null}
      {!groupsQuery.isPending && !groupsQuery.isError && filteredGroups.length > 0 ? (
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[32%]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>
                  <div className="flex min-w-48 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <HugeiconsIcon icon={UserGroup03Icon} size={17} strokeWidth={1.8} />
                    </span>
                    <span className="truncate font-medium text-foreground">{group.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={group.type === "owner" ? "default" : "outline"}
                    className="rounded-full px-2 py-0.5 text-[10px] font-normal"
                  >
                    {groupTypeLabels[group.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="block font-medium tabular-nums">
                      {group.participants.length}
                    </span>
                    <span className="block max-w-44 truncate text-[11px] text-muted-foreground">
                      {memberSummary(group) || "No members yet"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(group.createdAt)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={group.archivedAt ? "outline" : "secondary"}
                    className="rounded-full px-2 py-0.5 text-[10px] font-normal"
                  >
                    {group.archivedAt ? "Archived" : "Active"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      {groupsQuery.hasNextPage ? (
        <div className="flex justify-center border-t p-3">
          <Button
            variant="outline"
            size="sm"
            disabled={groupsQuery.isFetchingNextPage}
            onClick={() => void groupsQuery.fetchNextPage()}
          >
            {groupsQuery.isFetchingNextPage ? "Loading..." : "Load more groups"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
