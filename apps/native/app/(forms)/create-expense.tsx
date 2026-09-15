import { ExpenseForm } from "@/components/forms/expense/expense-form";
import { FormLoading } from "@/components/forms/form-loading";
import { parseReceiptParam } from "@/utils/scan";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

export default function CreateExpenseForm() {
  const router = useRouter();
  const { groupId: groupIdParam, receipt: receiptParam } = useLocalSearchParams<{
    groupId?: string;
    receipt?: string;
  }>();
  const groupId = typeof groupIdParam === "string" ? groupIdParam : undefined;
  const initialReceipt = parseReceiptParam(receiptParam);
  const participantQuery = useQuery(trpc.participant.current.queryOptions());
  const groupQuery = useQuery({
    ...trpc.group.get.queryOptions({ id: groupId ?? "" }),
    enabled: Boolean(groupId),
  });
  const { data: currentParticipant, error: participantError } = participantQuery;
  const { data: group, error: groupError } = groupQuery;

  if (participantError || groupError) {
    return (
      <View className="bg-page flex-1 items-center justify-center px-4">
        <View className="w-full items-center gap-4 rounded-2xl bg-panel p-4">
          <Typography selectable className="text-sm text-danger">
            {groupError ? "Unable to load this group." : "Unable to load your participant details."}
          </Typography>
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                void participantQuery.refetch();
                if (groupId) void groupQuery.refetch();
              }}
            >
              <Button.Label>Try again</Button.Label>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"))}
            >
              <Button.Label>Go back</Button.Label>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  if (!currentParticipant || (groupId && !group)) {
    return <FormLoading />;
  }

  return (
    <ExpenseForm
      currentParticipant={currentParticipant}
      group={group}
      initialReceipt={initialReceipt}
    />
  );
}
