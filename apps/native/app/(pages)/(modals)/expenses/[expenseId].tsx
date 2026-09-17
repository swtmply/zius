import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Button, Menu, Typography, useToast } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Archive02Icon,
  ChevronLeftFreeIcons,
  Check,
  Edit02Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

import { trpc } from "@/utils/trpc";
import { formatDate } from "@/utils";
import { ExpenseCreationToast } from "@/components/layout/expense-creation-toast";
import { ExpenseDetailsLoading } from "@/components/expenses/skeletons/expense-details-skeleton";
import {
  ExpenseOverview,
  ExpenseSummary,
} from "@/components/expenses/expense-summary";

export default function ExpenseDetails() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();

  const expenseQuery = useQuery(
    trpc.expense.get.queryOptions({ id: expenseId }),
  );
  const { data } = expenseQuery;
  const participantQuery = useQuery(trpc.participant.current.queryOptions());
  const { data: currentParticipant } = participantQuery;

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const [isSettling, setIsSettling] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<
    Record<string, "paid" | "unpaid">
  >({});
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const canEditPayments =
    data?.status === "active" &&
    !!currentParticipant &&
    data.payerId === currentParticipant.id;
  const isSettlingActive = isSettling && canEditPayments;
  const updateExpense = useMutation(
    trpc.expense.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.expense.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.group.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
        ]);
      },
    }),
  );
  const cancelExpense = useMutation(trpc.expense.cancel.mutationOptions());

  const submit = async () => {
    if (!data || !isSettlingActive || updateExpense.isPending) return;

    const participants = data.participants.flatMap((participant) => {
      const status = participantStatuses[participant.id];
      return status && status !== participant.status
        ? [{ id: participant.id, status }]
        : [];
    });

    if (participants.length === 0) {
      setIsSettling(false);
      setParticipantStatuses({});
      return;
    }

    try {
      await updateExpense.mutateAsync({ id: expenseId, participants });
    } catch (error) {
      toast.show({
        duration: 6000,
        component: (props) => (
          <ExpenseCreationToast
            {...props}
            variant="danger"
            title="Failed to update expense"
            description={
              error instanceof Error && error.message.trim()
                ? error.message
                : "Something went wrong. Please try again."
            }
          />
        ),
      });
      return;
    }

    setIsSettling(false);
    setParticipantStatuses({});
    toast.show({
      component: (props) => (
        <ExpenseCreationToast
          {...props}
          variant="success"
          title="Expense updated successfully"
          description="Your payment statuses have been saved."
        />
      ),
    });
  };

  const paidParticipantCount =
    data?.participants.filter((participant) => participant.status === "paid")
      .length ?? 0;

  const startSettling = () => {
    if (!canEditPayments || updateExpense.isPending) return;
    setParticipantStatuses({});
    setIsSettling(true);
  };

  const submitCancellation = async () => {
    if (
      !data ||
      !data.canCancel ||
      data.status !== "active" ||
      cancelExpense.isPending
    )
      return;

    try {
      await cancelExpense.mutateAsync({ id: expenseId });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.expense.get.queryKey({ id: expenseId }),
        }),
        queryClient.invalidateQueries({ queryKey: trpc.expense.pathKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.group.pathKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
      ]);
      setIsCancelDialogOpen(false);
      setIsSettling(false);
      setParticipantStatuses({});
      toast.show({
        component: (props) => (
          <ExpenseCreationToast
            {...props}
            variant="success"
            title="Expense cancelled"
            description="This expense no longer affects balances. Payment records remain visible."
          />
        ),
      });
    } catch (error) {
      toast.show({
        duration: 6000,
        component: (props) => (
          <ExpenseCreationToast
            {...props}
            variant="danger"
            title="Failed to cancel expense"
            description={
              error instanceof Error && error.message.trim()
                ? error.message
                : "Something went wrong. Please try again."
            }
          />
        ),
      });
    }
  };

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/home");

  if (
    !expenseQuery.isError &&
    !participantQuery.isError &&
    (expenseQuery.isPending || participantQuery.isPending)
  ) {
    return (
      <ScrollView
        className="flex-1 bg-page"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-4 pt-safe pb-safe-offset-8"
      >
        <ExpenseDetailsLoading />
      </ScrollView>
    );
  }

  if (expenseQuery.isError || participantQuery.isError || !data) {
    return (
      <ScrollView
        className="flex-1 bg-page"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-4 pt-safe pb-safe-offset-8"
      >
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-4 py-4">
            <Button
              isIconOnly
              variant="ghost"
              accessibilityLabel="Go back"
              onPress={goBack}
            >
              <HugeiconsIcon
                icon={ChevronLeftFreeIcons}
                size={24}
                color="#000000"
              />
            </Button>
            <Typography className="flex-1 text-center text-2xl font-semibold text-ink">
              Expense
            </Typography>
            <View className="size-12" />
          </View>
          <View className="items-center gap-4 py-8">
            <Typography
              selectable
              className="text-center text-sm text-supporting"
            >
              Unable to load expense details.
            </Typography>
            <Button
              variant="secondary"
              onPress={() => {
                void expenseQuery.refetch();
                void participantQuery.refetch();
              }}
            >
              <Button.Label>Try again</Button.Label>
            </Button>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-page">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-4 pt-safe pb-safe-offset-8"
      >
        <View className="flex-row items-center justify-between gap-4 py-4">
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="Go back"
            onPress={goBack}
          >
            <HugeiconsIcon
              icon={ChevronLeftFreeIcons}
              size={24}
              color="#000000"
            />
          </Button>
          <Typography
            selectable
            className="flex-1 text-center text-2xl font-semibold text-ink"
            numberOfLines={2}
          >
            {data.title}
          </Typography>
          {isSettlingActive ? (
            <Button
              isIconOnly
              variant="ghost"
              accessibilityLabel="Save payment statuses"
              isDisabled={updateExpense.isPending}
              accessibilityState={{ busy: updateExpense.isPending }}
              onPress={() => void submit()}
            >
              <HugeiconsIcon icon={Check} size={24} color="#000000" />
            </Button>
          ) : canEditPayments || data.canCancel ? (
            <Menu>
              <Menu.Trigger
                asChild
                isDisabled={cancelExpense.isPending || updateExpense.isPending}
              >
                <Button
                  isIconOnly
                  variant="ghost"
                  isDisabled={
                    cancelExpense.isPending || updateExpense.isPending
                  }
                  accessibilityLabel="Expense actions"
                  accessibilityState={{
                    disabled:
                      cancelExpense.isPending || updateExpense.isPending,
                  }}
                >
                  <HugeiconsIcon
                    icon={MoreHorizontalIcon}
                    size={24}
                    color="#000000"
                  />
                </Button>
              </Menu.Trigger>
              <Menu.Portal>
                <Menu.Overlay />
                <Menu.Content
                  presentation="popover"
                  width={120}
                  className="p-2"
                >
                  {canEditPayments ? (
                    <Menu.Item
                      className="gap-2 rounded-xl px-2 py-1.5"
                      isDisabled={
                        updateExpense.isPending || cancelExpense.isPending
                      }
                      onPress={startSettling}
                    >
                      <HugeiconsIcon
                        icon={Edit02Icon}
                        size={18}
                        color="#000000"
                      />
                      <Menu.ItemTitle className="text-sm font-normal">
                        Edit
                      </Menu.ItemTitle>
                    </Menu.Item>
                  ) : null}
                  {data.canCancel ? (
                    <Menu.Item
                      className="gap-2 rounded-xl px-2 py-1.5"
                      isDisabled={cancelExpense.isPending}
                      variant="danger"
                      onPress={() => setIsCancelDialogOpen(true)}
                    >
                      <HugeiconsIcon
                        icon={Archive02Icon}
                        size={18}
                        color="#FF3B30"
                      />
                      <Menu.ItemTitle className="text-sm font-normal">
                        Archive
                      </Menu.ItemTitle>
                    </Menu.Item>
                  ) : null}
                </Menu.Content>
              </Menu.Portal>
            </Menu>
          ) : (
            <View className="size-12" />
          )}
        </View>

        <ExpenseOverview expense={data} />

        {data.status === "cancelled" ? (
          <View
            className="gap-1 rounded-2xl border border-border bg-default px-4 py-3"
            accessible
            accessibilityLabel={`Cancelled by ${data.cancelledBy?.name ?? "an unknown user"} on ${
              data.cancelledAt
                ? formatDate(new Date(data.cancelledAt))
                : "an unknown date"
            }. Paid participant records remain visible.`}
          >
            <Typography className="text-sm font-semibold text-supporting">
              Cancelled
            </Typography>
            <Typography className="text-xs text-supporting">
              Cancelled by {data.cancelledBy?.name ?? "an unknown user"}
              {data.cancelledAt
                ? ` on ${formatDate(new Date(data.cancelledAt))}`
                : ""}
              .
            </Typography>
            <Typography className="text-xs text-supporting">
              This expense no longer affects balances. Paid participant records
              remain visible.
            </Typography>
          </View>
        ) : null}

        <ExpenseSummary
          expense={data}
          participantStatuses={participantStatuses}
          isSettling={isSettlingActive}
          isDisabled={updateExpense.isPending}
          onStatusChange={(participantId, status) => {
            setParticipantStatuses((statuses) => ({
              ...statuses,
              [participantId]: status,
            }));
          }}
        />
      </ScrollView>
      <BottomSheet
        isOpen={isCancelDialogOpen}
        onOpenChange={(isOpen) => {
          if (!cancelExpense.isPending) setIsCancelDialogOpen(isOpen);
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            detached
            bottomInset={insets.bottom + 12}
            className="mx-4 overflow-hidden"
            backgroundClassName="rounded-3xl"
            contentContainerClassName="p-5"
            enableDynamicSizing
            handleComponent={null}
          >
            <View className="mb-5 gap-1">
              <BottomSheet.Title>Cancel this expense?</BottomSheet.Title>
              <BottomSheet.Description>
                {paidParticipantCount === 0
                  ? "No participant payments have been recorded yet."
                  : `${paidParticipantCount} participant${paidParticipantCount === 1 ? " has" : "s have"} already paid.`}{" "}
                Cancellation is permanent and removes this expense from
                balances. Existing payment records remain visible.
              </BottomSheet.Description>
            </View>
            <View className="gap-1">
              <Button
                variant="danger"
                isDisabled={cancelExpense.isPending}
                accessibilityState={{ busy: cancelExpense.isPending }}
                onPress={() => void submitCancellation()}
              >
                <Button.Label>
                  {cancelExpense.isPending ? "Cancelling..." : "Cancel expense"}
                </Button.Label>
              </Button>
              <Button
                variant="ghost"
                isDisabled={cancelExpense.isPending}
                onPress={() => setIsCancelDialogOpen(false)}
              >
                <Button.Label>Keep expense</Button.Label>
              </Button>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}
