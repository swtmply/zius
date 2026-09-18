"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Archive02Icon,
  Check,
  ChevronLeftFreeIcons,
  Delete02Icon,
  Edit02Icon,
  RestoreBinIcon,
  XIcon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { ActionsMenu, ActionsMenuItem } from "./actions-menu";
import { GroupExpensesSection } from "./group-expenses";
import { GroupExpensesSectionLoading, GroupParticipantsLoading } from "./group-details-loading";
import { GroupParticipants } from "./group-participants";
import { refreshDashboard } from "./mutations";
import { dashboardRoutes, withQuery } from "./routes";
import { Sheet } from "./sheet";
import { Skeleton } from "./skeleton";
import { useUser } from "./user-context";

export function GroupDetails({ id }: { id: string }) {
  const user = useUser();
  const query = useQuery(trpc.group.get.queryOptions({ id }));
  const updateGroup = useMutation(trpc.group.update.mutationOptions());
  const archiveGroup = useMutation(trpc.group.archive.mutationOptions());
  const restoreGroup = useMutation(trpc.group.restore.mutationOptions());
  const [folded, setFolded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  const group = query.data;
  const unsettledExpenses = group?.expenses.filter((expense) => expense.status === "active") ?? [];
  const settledExpenses = group?.expenses.filter((expense) => expense.status !== "active") ?? [];
  const isOwner =
    group?.participants.find((participant) => participant.userId === user.id)?.role === "owner";
  const isArchived = !!group?.archivedAt;
  const canRename = isOwner && !isArchived;
  const isArchivePending = archiveGroup.isPending || restoreGroup.isPending;
  const isBusy = updateGroup.isPending || isArchivePending;

  async function submitName() {
    if (!group || !isEditing || !canRename || updateGroup.isPending) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Enter a group name", { description: "Add a name before saving the group." });
      return;
    }

    const toastId = toast.loading("Renaming group", { description: "Saving your group name." });

    try {
      await updateGroup.mutateAsync({ id, name: trimmedName });
      await refreshDashboard();
      setIsEditing(false);
      toast.success("Group renamed", {
        id: toastId,
        description: "Your group name has been updated.",
      });
    } catch (error) {
      toast.error("Failed to rename group", {
        id: toastId,
        description:
          error instanceof Error && error.message.trim() ? error.message : "Please try again.",
      });
    }
  }

  async function submitArchiveAction() {
    if (!group || !isOwner || isArchivePending) return;

    try {
      if (isArchived) await restoreGroup.mutateAsync({ id });
      else await archiveGroup.mutateAsync({ id });
      await refreshDashboard();
      setIsArchiveDialogOpen(false);
      setIsEditing(false);
      toast.success(isArchived ? "Group restored" : "Group archived", {
        description: isArchived
          ? "This group is back in your active groups."
          : "This group is hidden from your active groups.",
      });
    } catch (error) {
      toast.error(isArchived ? "Failed to restore group" : "Failed to archive group", {
        description:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 py-4">
        {isEditing ? (
          <button
            type="button"
            aria-label="Cancel editing group name"
            className="icon-button"
            disabled={updateGroup.isPending}
            onClick={() => setIsEditing(false)}
          >
            <HugeiconsIcon icon={XIcon} size={24} />
          </button>
        ) : (
          <Link href={dashboardRoutes.groups} aria-label="Go back" className="icon-button">
            <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
          </Link>
        )}

        <div className="flex min-w-0 flex-1 justify-center">
          {query.isPending ? (
            <Skeleton className="h-8 w-32" />
          ) : isEditing ? (
            <input
              autoFocus
              aria-label="Group name"
              value={name}
              disabled={updateGroup.isPending}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void submitName();
              }}
              className="h-11 w-full max-w-xs rounded-lg border border-border bg-panel px-2 text-center text-2xl font-semibold text-ink"
            />
          ) : (
            <h1 className="min-w-0 text-center text-2xl font-semibold break-words text-ink">
              {group?.name ?? "Group"}
            </h1>
          )}
        </div>

        {group && canRename && isEditing ? (
          <button
            type="button"
            aria-label="Save group name"
            className="icon-button"
            disabled={isBusy}
            onClick={() => void submitName()}
          >
            <HugeiconsIcon icon={Check} size={24} />
          </button>
        ) : group && isOwner && !isArchived ? (
          <ActionsMenu label="Group actions" isDisabled={isBusy}>
            <ActionsMenuItem
              icon={Edit02Icon}
              label="Edit"
              isDisabled={isBusy}
              onClick={() => {
                setName(group.name);
                setIsEditing(true);
              }}
            />
            <ActionsMenuItem icon={Delete02Icon} label="Delete" variant="danger" isDisabled />
            <ActionsMenuItem
              icon={Archive02Icon}
              label="Archive"
              variant="danger"
              isDisabled={isArchivePending}
              onClick={() => setIsArchiveDialogOpen(true)}
            />
          </ActionsMenu>
        ) : group && isOwner && isArchived ? (
          <button
            type="button"
            aria-label="Restore group"
            className="icon-button"
            disabled={isArchivePending}
            onClick={() => setIsArchiveDialogOpen(true)}
          >
            <HugeiconsIcon icon={RestoreBinIcon} size={24} />
          </button>
        ) : (
          <span className="size-12 shrink-0" />
        )}
      </div>

      {group && isArchived ? (
        <div className="space-y-1 rounded-2xl border border-border bg-page px-4 py-3">
          <p className="text-sm font-semibold text-supporting">Archived group</p>
          <p className="text-xs text-supporting">
            New expenses and name changes are disabled. Existing payments and expense cancellation
            remain available.
          </p>
        </div>
      ) : null}

      {query.isPending || group ? (
        <>
          <section className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm text-ink">Participants</h2>
              <button
                type="button"
                aria-expanded={!folded}
                className="flex min-h-11 items-center text-xs text-supporting"
                onClick={() => setFolded((value) => !value)}
              >
                {folded ? "Show Names" : "Hide Names"}
              </button>
            </div>
            {group ? (
              <GroupParticipants participants={group.participants} folded={folded} />
            ) : (
              <GroupParticipantsLoading folded={folded} />
            )}
          </section>

          {query.isPending ? (
            <>
              <GroupExpensesSectionLoading title="Unsettled Expenses" showAction />
              <GroupExpensesSectionLoading title="Settled Expenses" />
            </>
          ) : group ? (
            <>
              <GroupExpensesSection
                title="Unsettled Expenses"
                emptyMessage="No unsettled expenses."
                expenses={unsettledExpenses}
                addExpenseHref={
                  isArchived ? undefined : withQuery(dashboardRoutes.createExpense, { groupId: id })
                }
              />
              <GroupExpensesSection
                title="Settled Expenses"
                emptyMessage="No settled expenses."
                expenses={settledExpenses}
              />
            </>
          ) : null}
        </>
      ) : null}

      {query.isError ? (
        <div className="flex flex-col items-center gap-4 py-6" role="alert">
          <p className="text-xs text-supporting">
            {query.error.data?.code === "NOT_FOUND"
              ? "Group not found."
              : "Unable to load group details."}
          </p>
          <button
            type="button"
            className="action-secondary"
            onClick={() => {
              void query.refetch();
            }}
          >
            Try again
          </button>
        </div>
      ) : null}

      <Sheet
        isOpen={isArchiveDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isArchivePending) setIsArchiveDialogOpen(isOpen);
        }}
        title={isArchived ? "Restore group?" : "Archive group?"}
        description={
          isArchived
            ? "This group will appear in your active groups again."
            : "This hides the group from active lists. Existing debts remain, and payments or expense cancellation stay available. You can restore the group later."
        }
      >
        <div className="space-y-1">
          <button
            type="button"
            className={isArchived ? "action w-full" : "action-danger w-full"}
            disabled={isArchivePending}
            onClick={() => void submitArchiveAction()}
          >
            {isArchivePending
              ? isArchived
                ? "Restoring..."
                : "Archiving..."
              : isArchived
                ? "Restore group"
                : "Archive group"}
          </button>
          <button
            type="button"
            className="action-secondary w-full bg-transparent"
            disabled={isArchivePending}
            onClick={() => setIsArchiveDialogOpen(false)}
          >
            Cancel
          </button>
        </div>
      </Sheet>
    </div>
  );
}
