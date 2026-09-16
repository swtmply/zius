"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Archive02Icon, Check, Edit02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { ActionsMenu, ActionsMenuItem } from "./actions-menu";
import { ExpenseDetailsLoading } from "./expense-details-loading";
import { ExpenseOverview, ExpenseSummary, type ExpenseParticipantStatus } from "./expense-summary";
import { formatLongDate } from "./format";
import { refreshDashboard } from "./mutations";
import { dashboardRoutes } from "./routes";
import { ScreenHeader } from "./screen-header";
import { Sheet } from "./sheet";

export function ExpenseDetails({ id }: { id: string }) {
  const query = useQuery(trpc.expense.get.queryOptions({ id }));
  const updateExpense = useMutation(trpc.expense.update.mutationOptions());
  const cancelExpense = useMutation(trpc.expense.cancel.mutationOptions());
  const [isSettling, setIsSettling] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<
    Record<string, ExpenseParticipantStatus>
  >({});
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const data = query.data;
  const canEditPayments = data?.status === "active" && data.isPayer;
  const isSettlingActive = isSettling && !!canEditPayments;
  const isBusy = updateExpense.isPending || cancelExpense.isPending;
  const paidParticipantCount =
    data?.participants.filter((participant) => participant.status === "paid").length ?? 0;

  async function submit() {
    if (!data || !isSettlingActive || updateExpense.isPending) return;

    const participants = data.participants.flatMap((participant) => {
      const status = participantStatuses[participant.id];
      return status && status !== participant.status ? [{ id: participant.id, status }] : [];
    });

    if (participants.length === 0) {
      setIsSettling(false);
      setParticipantStatuses({});
      return;
    }

    try {
      await updateExpense.mutateAsync({ id, participants });
      await refreshDashboard();
      setIsSettling(false);
      setParticipantStatuses({});
      toast.success("Expense updated successfully", {
        description: "Your payment statuses have been saved.",
      });
    } catch (error) {
      toast.error("Failed to update expense", {
        description:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  async function submitCancellation() {
    if (!data || !data.canCancel || data.status !== "active" || cancelExpense.isPending) return;

    try {
      await cancelExpense.mutateAsync({ id });
      await refreshDashboard();
      setIsCancelDialogOpen(false);
      setIsSettling(false);
      setParticipantStatuses({});
      toast.success("Expense cancelled", {
        description: "This expense no longer affects balances. Payment records remain visible.",
      });
    } catch (error) {
      toast.error("Failed to cancel expense", {
        description:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Something went wrong. Please try again.",
      });
    }
  }

  if (query.isPending) return <ExpenseDetailsLoading />;

  if (query.isError || !data) {
    return (
      <>
        <ScreenHeader backHref={dashboardRoutes.home} title="Expense" align="center" />
        <div className="flex flex-col items-center gap-4 py-8" role="alert">
          <p className="text-center text-sm text-supporting">Unable to load expense details.</p>
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
      </>
    );
  }

  return (
    <div className="space-y-4">
      <ScreenHeader backHref={dashboardRoutes.home} title={data.title} align="center">
        {isSettlingActive ? (
          <button
            type="button"
            aria-label="Save payment statuses"
            className="icon-button"
            disabled={updateExpense.isPending}
            onClick={() => void submit()}
          >
            <HugeiconsIcon icon={Check} size={24} />
          </button>
        ) : canEditPayments || data.canCancel ? (
          <ActionsMenu label="Expense actions" isDisabled={isBusy}>
            {canEditPayments ? (
              <ActionsMenuItem
                icon={Edit02Icon}
                label="Edit"
                isDisabled={isBusy}
                onClick={() => {
                  setParticipantStatuses({});
                  setIsSettling(true);
                }}
              />
            ) : null}
            {data.canCancel ? (
              <ActionsMenuItem
                icon={Archive02Icon}
                label="Archive"
                variant="danger"
                isDisabled={isBusy}
                onClick={() => setIsCancelDialogOpen(true)}
              />
            ) : null}
          </ActionsMenu>
        ) : null}
      </ScreenHeader>

      <ExpenseOverview expense={data} />

      {data.status === "cancelled" ? (
        <div className="space-y-1 rounded-2xl border border-border bg-page px-4 py-3">
          <p className="text-sm font-semibold text-supporting">Cancelled</p>
          <p className="text-xs text-supporting">
            Cancelled by {data.cancelledBy?.name ?? "an unknown user"}
            {data.cancelledAt ? ` on ${formatLongDate(data.cancelledAt)}` : ""}.
          </p>
          <p className="text-xs text-supporting">
            This expense no longer affects balances. Paid participant records remain visible.
          </p>
        </div>
      ) : null}

      <ExpenseSummary
        expense={data}
        participantStatuses={participantStatuses}
        isSettling={isSettlingActive}
        isDisabled={updateExpense.isPending}
        onStatusChange={(participantId, status) => {
          setParticipantStatuses((statuses) => ({ ...statuses, [participantId]: status }));
        }}
      />

      <Sheet
        isOpen={isCancelDialogOpen}
        onOpenChange={(isOpen) => {
          if (!cancelExpense.isPending) setIsCancelDialogOpen(isOpen);
        }}
        title="Cancel this expense?"
        description={`${
          paidParticipantCount === 0
            ? "No participant payments have been recorded yet."
            : `${paidParticipantCount} participant${paidParticipantCount === 1 ? " has" : "s have"} already paid.`
        } Cancellation is permanent and removes this expense from balances. Existing payment records remain visible.`}
      >
        <div className="space-y-1">
          <button
            type="button"
            className="action-danger w-full"
            disabled={cancelExpense.isPending}
            onClick={() => void submitCancellation()}
          >
            {cancelExpense.isPending ? "Cancelling..." : "Cancel expense"}
          </button>
          <button
            type="button"
            className="action-secondary w-full bg-transparent"
            disabled={cancelExpense.isPending}
            onClick={() => setIsCancelDialogOpen(false)}
          >
            Keep expense
          </button>
        </div>
      </Sheet>
    </div>
  );
}
