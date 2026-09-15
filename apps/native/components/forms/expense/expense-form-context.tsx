import { ExpenseCreationToast } from "@/components/expense-creation-toast";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@zius/api/routers/index";
import { useToast } from "heroui-native";
import { createContext, use, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { trpc } from "@/utils/trpc";
import type { ParsedReceipt } from "@/utils/scan";
import type { ExpenseCategory } from "./expense-form-actions";
import {
  clearInvalidItemAssignments,
  createExpenseItem,
  expenseFormValidators,
  recalculateParticipants,
  splitMethods,
  sumExpenseItemPrices,
  type ExpenseItem,
  type FormParticipant,
  type SplitMethod,
  type ExpenseFormValues,
} from "./expense-form-model";

export type ExpenseFormProps = {
  currentParticipant: inferRouterOutputs<AppRouter>["participant"]["current"];
  group?: inferRouterOutputs<AppRouter>["group"]["get"];
  initialReceipt?: ParsedReceipt;
};

type SubmitMeta = { groupChoice?: "group" | "standalone" };
const defaultSubmitMeta: SubmitMeta = {};

export function useExpenseFormController({
  currentParticipant,
  group,
  initialReceipt,
}: ExpenseFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupChoice, setGroupChoice] = useState<NonNullable<SubmitMeta["groupChoice"]>>("group");
  const categoryRef = useRef<ExpenseCategory | undefined>(undefined);
  const [categoryResetKey, setCategoryResetKey] = useState(0);
  const groupParticipants = group?.participants ?? [currentParticipant];
  const [groupMemberEmails, setGroupMemberEmails] = useState<string[]>(() =>
    (group?.participants ?? []).map((participant) => participant.email.toLowerCase()),
  );

  const findOutsideParticipants = (
    groupId: string | undefined,
    participants: FormParticipant[],
  ) => {
    if (!groupId) {
      return [];
    }

    const memberEmails = new Set(groupMemberEmails);

    return participants.filter((participant) => !memberEmails.has(participant.email.toLowerCase()));
  };

  const defaultValues: ExpenseFormValues = {
    totalMinor:
      initialReceipt?.totalMinor ??
      (initialReceipt
        ? (sumExpenseItemPrices(
            initialReceipt.items.map((item, index) => createExpenseItem(item, `receipt_${index}`)),
          ) ?? 0)
        : 0),
    title: "",
    splitMethod: initialReceipt ? "items" : splitMethods[0],
    payer: currentParticipant.email,
    group_id: group?.id,
    participants: groupParticipants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      email: participant.email,
      image: "image" in participant ? participant.image : undefined,
      userId: participant.userId ?? undefined,
      owedMinor: 0,
      splitValue: 0,
      isSplitValueEdited: false,
      status: "unpaid",
    })),
    items:
      initialReceipt?.items.map((item, index) => createExpenseItem(item, `receipt_${index}`)) ?? [],
    occurredAt: Date.now(),
    currency: "PHP",
  };
  const router = useRouter();

  const createExpense = useMutation(trpc.expense.create.mutationOptions());

  const form = useForm({
    defaultValues,
    onSubmitMeta: defaultSubmitMeta,
    // Cross-field errors from blur can outlive the values that produced them.
    // Keep the full schema on change and submit so every input order can recover.
    validators: expenseFormValidators,
    onSubmitInvalid: () => {
      setHasSubmitted(true);
      setIsGroupDialogOpen(false);
      Keyboard.dismiss();
    },
    onSubmit: async ({ value, meta }) => {
      // A selected group can only take the expense when every participant already
      // belongs to it. Otherwise the choice is a new group or a standalone expense.
      const needsGroupChoice =
        !value.group_id || findOutsideParticipants(value.group_id, value.participants).length > 0;

      if (needsGroupChoice && !meta.groupChoice) {
        Keyboard.dismiss();
        setGroupChoice("group");
        setIsGroupDialogOpen(true);
        return;
      }

      setIsGroupDialogOpen(false);
      const items =
        value.splitMethod === "items"
          ? (value.items ?? []).map((item) => ({
              name: item.name.trim(),
              quantity: item.quantity,
              priceMinor: item.priceMinor,
              participantEmail: item.participantEmail?.trim().toLowerCase() ?? "",
            }))
          : [];
      let expenseId: string;
      try {
        const createdExpense = await createExpense.mutateAsync({
          ...value,
          title: value.title.trim(),
          category: categoryRef.current ?? "others",
          items,
          groupId: needsGroupChoice ? undefined : value.group_id,
          createGroup: needsGroupChoice && meta.groupChoice === "group",
        });
        expenseId = createdExpense.id;
      } catch (error) {
        const code = error instanceof TRPCClientError ? error.data?.code : undefined;
        const description =
          code === "UNAUTHORIZED"
            ? "Your session has expired. Sign in again before submitting."
            : code === "FORBIDDEN" || code === "NOT_FOUND"
              ? "This group may no longer be available. Select another group or create a standalone expense."
              : code === "BAD_REQUEST"
                ? "Check the expense details and participant splits, then submit again."
                : "We couldn't confirm that your expense was saved. Check your connection and expense history before trying again.";

        toast.show({
          duration: 6000,
          component: (props) => (
            <ExpenseCreationToast {...props} variant="danger" description={description} />
          ),
        });
        return;
      }

      await Promise.allSettled([
        queryClient.invalidateQueries({ queryKey: trpc.group.pathKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.expense.pathKey() }),
        queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
      ]);

      form.reset();
      setHasSubmitted(false);
      categoryRef.current = undefined;
      setCategoryResetKey((key) => key + 1);
      setGroupMemberEmails(
        (group?.participants ?? []).map((participant) => participant.email.toLowerCase()),
      );
      toast.show({
        component: (props) => (
          <ExpenseCreationToast
            {...props}
            variant="success"
            description="Your expense has been created."
          />
        ),
      });
      router.replace({
        pathname: "/(modals)/expenses/[expenseId]",
        params: { expenseId },
      });
    },
  });

  const submit = (meta: SubmitMeta = defaultSubmitMeta) => {
    if (!form.state.isSubmitting && !selectGroup.isPending) {
      void form.handleSubmit(meta);
    }
  };

  const recalculateParticipantAmounts = () => {
    const { totalMinor, splitMethod, items } = form.state.values;

    form.setFieldValue("participants", (participants) =>
      recalculateParticipants(participants, totalMinor, splitMethod, items ?? []),
    );
  };

  const setSplitMethod = (splitMethod: SplitMethod) => {
    form.setFieldValue("splitMethod", splitMethod);
    form.setFieldValue("participants", (participants) =>
      recalculateParticipants(
        participants.map((participant) => ({
          ...participant,
          splitValue: 0,
          isSplitValueEdited: false,
        })),
        form.state.values.totalMinor,
        splitMethod,
        form.state.values.items ?? [],
      ),
    );
  };

  const setParticipants = (
    participants: FormParticipant[],
    items: ExpenseItem[] = form.state.values.items ?? [],
  ) => {
    const validItems = clearInvalidItemAssignments(items, participants);

    form.setFieldValue("items", validItems);
    form.setFieldValue(
      "participants",
      recalculateParticipants(
        participants,
        form.state.values.totalMinor,
        form.state.values.splitMethod,
        validItems,
      ),
    );
  };

  const setItems = (items: ExpenseItem[]) => {
    setParticipants(form.state.values.participants, items);
  };

  const selectGroup = useMutation({
    mutationFn: (groupId: string) =>
      queryClient.fetchQuery(trpc.group.get.queryOptions({ id: groupId })),
    onSuccess: (selectedGroup) => {
      form.setFieldValue("group_id", selectedGroup.id);
      setGroupMemberEmails(
        selectedGroup.participants.map((participant) => participant.email.toLowerCase()),
      );
      const participants = selectedGroup.participants.map(
        ({ id, name, email, image, userId }): FormParticipant => ({
          id,
          name,
          email,
          image,
          userId: userId ?? undefined,
          owedMinor: 0,
          splitValue: 0,
          isSplitValueEdited: false,
          status: "unpaid",
        }),
      );
      if (!participants.some((participant) => participant.email === form.state.values.payer)) {
        form.setFieldValue("payer", currentParticipant.email);
      }
      setParticipants(participants);
    },
  });

  const setParticipantSplitValue = (participantId: string, value: number) => {
    setParticipants(
      form.state.values.participants.map((participant) =>
        participant.id === participantId
          ? {
              ...participant,
              splitValue: value,
              isSplitValueEdited: true,
            }
          : participant,
      ),
    );
  };

  const removeParticipant = (participantId: string) => {
    const participant = form.state.values.participants.find((item) => item.id === participantId);

    if (participant?.email === form.state.values.payer) {
      form.setFieldValue("payer", currentParticipant.email);
    }

    setParticipants(form.state.values.participants.filter((item) => item.id !== participantId));
  };

  return {
    form,
    currentParticipant,
    group,
    hasSubmitted,
    isGroupDialogOpen,
    setIsGroupDialogOpen,
    groupChoice,
    setGroupChoice,
    categoryRef,
    categoryResetKey,
    selectGroup,
    setGroupMemberEmails,
    submit,
    recalculateParticipantAmounts,
    setSplitMethod,
    setParticipants,
    setItems,
    setParticipantSplitValue,
    removeParticipant,
  };
}

export const ExpenseFormContext = createContext<ReturnType<typeof useExpenseFormController> | null>(
  null,
);

export function useExpenseForm() {
  const context = use(ExpenseFormContext);
  if (!context) throw new Error("Expense form sections require ExpenseFormContext");
  return context;
}
