import { View, FlatList, ScrollView } from "react-native";
import React, { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Avatar, Button, Card, Separator, Switch, Typography, useToast } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ChevronLeftFreeIcons,
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
import { formatCurrency } from "@/utils";
import { SectionHeader } from "@/components/section-header";
import { BillCreationToast } from "@/components/bill-creation-toast";
import { TransactionDetailsLoading } from "@/components/transactions/transaction-details-loading";

export default function TransactionDetails() {
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();

  const transactionQuery = useQuery(trpc.bill.get.queryOptions({ id: transactionId }));
  const { data } = transactionQuery;
  const participantQuery = useQuery(trpc.participant.current.queryOptions());
  const { data: currentParticipant } = participantQuery;

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSettling, setIsSettling] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, "paid" | "unpaid">>(
    {},
  );
  const updateBill = useMutation(
    trpc.bill.update.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.bill.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
        ]);
      },
    }),
  );

  const submit = async () => {
    if (!data || !isSettling || updateBill.isPending) return;

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
      await updateBill.mutateAsync({ id: transactionId, participants });
    } catch (error) {
      toast.show({
        duration: 6000,
        component: (props) => (
          <BillCreationToast
            {...props}
            variant="danger"
            title="Failed to update bill"
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
        <BillCreationToast
          {...props}
          variant="success"
          title="Bill updated successfully"
          description="Your payment statuses have been saved."
        />
      ),
    });
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  if (
    !transactionQuery.isError &&
    !participantQuery.isError &&
    (transactionQuery.isPending || participantQuery.isPending)
  ) {
    return (
      <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic">
        <View className="flex-1 pt-safe pb-safe-offset-8 gap-4 px-4">
          <TransactionDetailsLoading />
        </View>
      </ScrollView>
    );
  }

  if (transactionQuery.isError || participantQuery.isError || !data) {
    return (
      <ScrollView className="flex-1 bg-background" contentInsetAdjustmentBehavior="automatic">
        <View className="flex-1 pt-safe pb-safe-offset-8 gap-4 px-4">
          <View className="flex-row items-center justify-between py-4">
            <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={goBack}>
              <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
            </Button>
            <Typography className="text-2xl font-semibold">Transaction</Typography>
            <View className="size-10" />
          </View>
          <View className="items-center gap-4 py-8">
            <Typography selectable className="text-sm text-muted text-center">
              Unable to load transaction details.
            </Typography>
            <Button
              variant="secondary"
              onPress={() => {
                void transactionQuery.refetch();
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
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel={isSettling ? "Save payment statuses" : "Delete transaction"}
            isDisabled={updateBill.isPending}
            onPress={isSettling ? () => void submit() : undefined}
          >
            <HugeiconsIcon icon={isSettling ? Check : Trash} size={24} />
          </Button>
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
                <Button
                  variant={isSettling ? "primary" : "secondary"}
                  isIconOnly
                  accessibilityLabel={
                    isSettling
                      ? "Cancel settling"
                      : data.status === "settled"
                        ? "Transaction already settled"
                        : "Edit payment statuses"
                  }
                  isDisabled={data.status === "settled" || updateBill.isPending}
                  onPress={
                    data.status === "settled"
                      ? undefined
                      : () => {
                          setParticipantStatuses({});
                          setIsSettling((value) => !value);
                        }
                  }
                >
                  <HugeiconsIcon
                    icon={data.status === "settled" ? Check : Edit02FreeIcons}
                    size={24}
                    color={isSettling ? "#ffffff" : undefined}
                  />
                </Button>
                <Typography className="text-xs text-muted">
                  {data.status === "settled" ? "Settled" : "Settle"}
                </Typography>
              </View>
            </View>
          </Card.Body>
        </Card>

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
                  {isSettling ? (
                    <Switch
                      accessibilityLabel={`${item.name} paid`}
                      isSelected={isPaid}
                      isDisabled={updateBill.isPending}
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
    </ScrollView>
  );
}
