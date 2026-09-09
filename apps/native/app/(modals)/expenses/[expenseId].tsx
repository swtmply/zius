import { View, FlatList, ScrollView } from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Avatar,
  Button,
  Card,
  Dialog,
  Separator,
  Switch,
  Typography,
  useToast,
} from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ChevronLeftFreeIcons,
  Cancel01Icon,
  UserCheck01FreeIcons,
  Edit02FreeIcons,
  UserGroup03Icon,
  Split,
  Check,
  Trash,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { formatCurrency, formatDate } from "@/utils";
import { SectionHeader } from "@/components/section-header";
import { ExpenseCreationToast } from "@/components/expense-creation-toast";
import { ExpenseDetailsLoading } from "@/components/expenses/expense-details-loading";

export default function ExpenseDetails() {
  const { expenseId } = useLocalSearchParams<{ expenseId: string }>();

  const expenseQuery = useQuery(trpc.expense.get.queryOptions({ id: expenseId }));
  const { data } = expenseQuery;
  const participantQuery = useQuery(trpc.participant.current.queryOptions());
  const { data: currentParticipant } = participantQuery;

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSettling, setIsSettling] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, "paid" | "unpaid">>(
    {},
  );
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const canEditPayments =
    data?.status === "active" &&
    !!currentParticipant &&
    (data.payerId === currentParticipant.id ||
      data.participants.some((participant) => participant.id === currentParticipant.id));
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
      return status && status !== participant.status ? [{ id: participant.id, status }] : [];
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
    data?.participants.filter((participant) => participant.status === "paid").length ?? 0;

  const submitCancellation = async () => {
    if (!data || !data.canCancel || data.status !== "active" || cancelExpense.isPending) return;

    try {
      await cancelExpense.mutateAsync({ id: expenseId });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: trpc.expense.get.queryKey({ id: expenseId }) }),
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

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  if (
    !expenseQuery.isError &&
    !participantQuery.isError &&
    (expenseQuery.isPending || participantQuery.isPending)
  ) {
    return (
      <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic">
        <View className="flex-1 pt-safe pb-safe-offset-8 gap-4 px-4">
          <ExpenseDetailsLoading />
        </View>
      </ScrollView>
    );
  }

  if (expenseQuery.isError || participantQuery.isError || !data) {
    return (
      <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic">
        <View className="flex-1 pt-safe pb-safe-offset-8 gap-4 px-4">
          <View className="flex-row items-center justify-between py-4">
            <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={goBack}>
              <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
            </Button>
            <Typography className="text-2xl font-semibold">Expense</Typography>
            <View className="size-10" />
          </View>
          <View className="items-center gap-4 py-8">
            <Typography selectable className="text-sm text-muted text-center">
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
    <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic">
      <View className="flex-1 pt-safe pb-safe-offset-8 gap-4 px-4">
        <View className="flex-row justify-between items-center py-4">
          <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={goBack}>
            <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
          </Button>
          <Typography className="text-2xl font-semibold flex-1 text-center" numberOfLines={2}>
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
              <HugeiconsIcon icon={Check} size={24} />
            </Button>
          ) : data.canCancel ? (
            <Button
              isIconOnly
              variant="ghost"
              accessibilityLabel="Cancel expense"
              isDisabled={cancelExpense.isPending}
              accessibilityState={{ busy: cancelExpense.isPending }}
              onPress={() => setIsCancelDialogOpen(true)}
            >
              <HugeiconsIcon icon={Trash} size={24} />
            </Button>
          ) : (
            <View className="size-10" />
          )}
        </View>

        <Card className="shadow-lg border border-border">
          <Card.Body className="gap-4">
            <View className="items-center justify-between flex-row px-4">
              <View className="items-center justify-center flex-1 gap-1">
                <Typography className="text-sm text-muted">Total Amount</Typography>
                <Typography className="text-2xl font-semibold">
                  {formatCurrency(data.totalMinor)}
                </Typography>
              </View>
              <View className="items-center justify-center flex-1 gap-1">
                <Typography className="text-sm text-muted">
                  {currentParticipant
                    ? currentParticipant.id === data.payerId
                      ? "Utang sayo"
                      : "Utang mo"
                    : "Amount owed"}
                </Typography>
                <Typography className="text-2xl font-semibold">
                  {formatCurrency(data.amountMinor)}
                </Typography>
              </View>
            </View>
            <Separator className="border-t-2 border-dashed border-border bg-transparent" />
            <View className="items-center flex-row">
              <View className="items-center flex-1 gap-1">
                <Button variant="secondary" isIconOnly>
                  <HugeiconsIcon icon={UserCheck01FreeIcons} size={24} />
                </Button>
                <Typography className="text-xs text-muted">{data.payerName}</Typography>
              </View>
              <View className="items-center flex-1 gap-1">
                <Button variant="secondary" isIconOnly>
                  <HugeiconsIcon icon={Split} size={24} />
                </Button>
                <Typography className="text-xs text-muted capitalize">
                  {data.splitMethod}
                </Typography>
              </View>
              <View className="items-center flex-1 gap-1">
                <Button variant="secondary" isIconOnly>
                  <HugeiconsIcon icon={UserGroup03Icon} size={24} />
                </Button>
                <Typography className="text-xs text-muted">
                  {data.groupId ? data.groupName : "Standalone"}
                </Typography>
              </View>
              <View className="items-center flex-1 gap-1">
                {canEditPayments ? (
                  <Button
                    variant={isSettlingActive ? "primary" : "secondary"}
                    isIconOnly
                    accessibilityLabel={
                      isSettlingActive ? "Cancel settling" : "Edit payment statuses"
                    }
                    isDisabled={updateExpense.isPending}
                    onPress={() => {
                      setParticipantStatuses({});
                      setIsSettling((value) => !value);
                    }}
                  >
                    <HugeiconsIcon
                      icon={Edit02FreeIcons}
                      size={24}
                      color={isSettlingActive ? "#ffffff" : undefined}
                    />
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    isIconOnly
                    isDisabled
                    accessibilityLabel={
                      data.status === "settled" ? "Expense already settled" : "Expense cancelled"
                    }
                  >
                    <HugeiconsIcon
                      icon={data.status === "settled" ? Check : Cancel01Icon}
                      size={24}
                    />
                  </Button>
                )}
                <Typography className="text-xs text-muted">
                  {data.status === "settled"
                    ? "Settled"
                    : data.status === "cancelled"
                      ? "Cancelled"
                      : isSettlingActive
                        ? "Save"
                        : "Settle"}
                </Typography>
              </View>
            </View>
          </Card.Body>
        </Card>

        {data.status === "cancelled" ? (
          <View
            className="bg-default border border-border rounded-xl px-4 py-3 gap-1"
            accessible
            accessibilityLabel={`Cancelled by ${data.cancelledBy?.name ?? "an unknown user"} on ${
              data.cancelledAt ? formatDate(new Date(data.cancelledAt)) : "an unknown date"
            }. Paid participant records remain visible.`}
          >
            <Typography className="text-sm font-semibold text-muted">Cancelled</Typography>
            <Typography className="text-xs text-muted">
              Cancelled by {data.cancelledBy?.name ?? "an unknown user"}
              {data.cancelledAt ? ` on ${formatDate(new Date(data.cancelledAt))}` : ""}.
            </Typography>
            <Typography className="text-xs text-muted">
              This expense no longer affects balances. Paid participant records remain visible.
            </Typography>
          </View>
        ) : null}

        <SectionHeader title="Participants" />

        <FlatList
          scrollEnabled={false}
          data={data.participants}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={<View className="h-4" />}
          renderItem={({ item }) => {
            const isPaid = (participantStatuses[item.id] ?? item.status) === "paid";
            return (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1 flex-1">
                  <Avatar size="sm">
                    <Avatar.Fallback>{item.name[0].toUpperCase()}</Avatar.Fallback>
                  </Avatar>
                  <Typography className="text-sm shrink" numberOfLines={1}>
                    {item.name}
                  </Typography>
                  {isPaid ? (
                    <View className="bg-accent rounded-full px-2">
                      <Typography className="text-xs text-accent-foreground">Paid</Typography>
                    </View>
                  ) : null}
                </View>

                <View className="flex-row items-center gap-1">
                  <Typography className="text-sm font-semibold">
                    {formatCurrency(item.owedMinor)}
                  </Typography>
                  {isSettlingActive ? (
                    <Switch
                      accessibilityLabel={`${item.name} paid`}
                      isSelected={isPaid}
                      isDisabled={updateExpense.isPending}
                      onSelectedChange={(isSelected) => {
                        setParticipantStatuses((statuses) => ({
                          ...statuses,
                          [item.id]: isSelected ? "paid" : "unpaid",
                        }));
                      }}
                    />
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      </View>
      <Dialog
        isOpen={isCancelDialogOpen}
        onOpenChange={(isOpen) => {
          if (!cancelExpense.isPending) setIsCancelDialogOpen(isOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <View className="mb-5 gap-1">
              <Dialog.Title>Cancel this expense?</Dialog.Title>
              <Dialog.Description>
                {paidParticipantCount === 0
                  ? "No participant payments have been recorded yet."
                  : `${paidParticipantCount} participant${paidParticipantCount === 1 ? " has" : "s have"} already paid.`}{" "}
                Cancellation is permanent and removes this expense from balances. Existing payment
                records remain visible.
              </Dialog.Description>
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </ScrollView>
  );
}
