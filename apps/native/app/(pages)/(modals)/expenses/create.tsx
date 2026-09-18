import { ExpenseForm } from "@/components/expenses/expense-form/expense-form";
import { FormLoading } from "@/components/expenses/skeletons/expense-form-skeleton";
import MockCreateExpense from "@/components/layout/onboarding/mock-screens/create-expense";
import { parseReceiptParam } from "@/utils/scan-utils";
import { getAlwaysShowSpotlights } from "@/utils/spotlights";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "@/utils/navigation";
import { Button, Typography } from "heroui-native";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";

const CREATE_EXPENSE_ONBOARDING_STORAGE_KEY = "create-expense-onboarding-completed";
const CREATE_EXPENSE_ONBOARDING_COMPLETED_VALUE = "true";

export default function CreateExpenseForm() {
  const router = useRouter();
  const { groupId: groupIdParam, receipt: receiptParam } = useLocalSearchParams<{
    groupId?: string;
    receipt?: string;
  }>();
  const groupId = typeof groupIdParam === "string" ? groupIdParam : undefined;
  const initialReceipt = parseReceiptParam(receiptParam);
  const showCreateExpenseOnboarding = !groupId && !initialReceipt;
  const [isOnboardingVisible, setIsOnboardingVisible] = useState<boolean | null>(
    showCreateExpenseOnboarding ? null : false,
  );
  const {
    data: currentParticipant,
    error: participantError,
    refetch: refetchParticipant,
  } = useQuery(trpc.participant.current.queryOptions());
  const {
    data: group,
    error: groupError,
    refetch: refetchGroup,
  } = useQuery({
    ...trpc.group.get.queryOptions({ id: groupId ?? "" }),
    enabled: Boolean(groupId),
  });

  useEffect(() => {
    if (!showCreateExpenseOnboarding) {
      setIsOnboardingVisible(false);
      return;
    }

    let isMounted = true;

    void Promise.all([
      SecureStore.getItemAsync(CREATE_EXPENSE_ONBOARDING_STORAGE_KEY),
      getAlwaysShowSpotlights(),
    ])
      .then(([value, alwaysShowSpotlights]) => {
        if (isMounted) {
          setIsOnboardingVisible(
            value !== CREATE_EXPENSE_ONBOARDING_COMPLETED_VALUE ||
              (__DEV__ && alwaysShowSpotlights),
          );
        }
      })
      .catch(() => {
        if (isMounted) setIsOnboardingVisible(true);
      });

    return () => {
      isMounted = false;
    };
  }, [showCreateExpenseOnboarding]);

  const completeOnboarding = useCallback(async () => {
    setIsOnboardingVisible(false);

    try {
      await SecureStore.setItemAsync(
        CREATE_EXPENSE_ONBOARDING_STORAGE_KEY,
        CREATE_EXPENSE_ONBOARDING_COMPLETED_VALUE,
      );
    } catch {
      console.warn("Could not persist create expense onboarding completion");
    }
  }, []);

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
                void refetchParticipant();
                if (groupId) void refetchGroup();
              }}
            >
              <Button.Label>Try again</Button.Label>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
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

  if (showCreateExpenseOnboarding && isOnboardingVisible === null) {
    return <FormLoading />;
  }

  if (showCreateExpenseOnboarding && isOnboardingVisible) {
    return <MockCreateExpense onComplete={completeOnboarding} />;
  }

  return (
    <ExpenseForm
      currentParticipant={currentParticipant}
      group={group}
      initialReceipt={initialReceipt}
    />
  );
}
