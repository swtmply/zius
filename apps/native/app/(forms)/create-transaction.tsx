import { TransactionForm } from "@/components/forms/transaction/transaction-form";
import { FormLoading } from "@/components/forms/form-loading";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Typography } from "heroui-native";
import { View } from "react-native";

export default function CreateTransactionForm() {
  const { groupId: groupIdParam } = useLocalSearchParams<{ groupId?: string }>();
  const groupId = typeof groupIdParam === "string" ? groupIdParam : undefined;
  const { data: currentParticipant, error: participantError } = useQuery(
    trpc.participant.current.queryOptions(),
  );
  const { data: group, error: groupError } = useQuery({
    ...trpc.group.get.queryOptions({ id: groupId ?? "" }),
    enabled: Boolean(groupId),
  });

  if (participantError || groupError) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-4">
        <Typography selectable className="text-sm text-danger">
          {groupError ? "Unable to load this group." : "Unable to load your participant details."}
        </Typography>
      </View>
    );
  }

  if (!currentParticipant || (groupId && !group)) {
    return <FormLoading />;
  }

  return <TransactionForm currentParticipant={currentParticipant} group={group} />;
}
