import { ExpenseCreationToast } from "@/components/expense-creation-toast";
import { SectionHeader } from "@/components/section-header";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@zius/api/routers/index";
import {
  Button,
  Dialog,
  PressableFeedback,
  Typography,
  useToast,
} from "heroui-native";
import { useState } from "react";
import { Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CurrencyInput } from "./currency-input";
import { GuestDialog } from "./guest-dialog";
import { GroupSelector } from "./group-selector";
import { ParticipantList } from "./participant-list";
import { SplitMethodSelector } from "./split-method-selector";
import { ExpenseFormHeader } from "./expense-form-header";
import { ExpenseItemList } from "./expense-item-list";
import {
  clearInvalidItemAssignments,
  createExpenseItem,
  createExpenseSchema,
  recalculateParticipants,
  splitMethods,
  sumExpenseItemPrices,
  type ExpenseItem,
  type FormParticipant,
  type SplitMethod,
  type ExpenseFormValues,
} from "./expense-form-model";
import { ExpenseTitleInput } from "./expense-title-input";
import { formatCurrency } from "@/utils";
import { trpc } from "@/utils/trpc";
import type { ParsedReceipt } from "@/utils/scan";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { XIcon } from "@hugeicons/core-free-icons";

type ExpenseFormProps = {
  currentParticipant: inferRouterOutputs<AppRouter>["participant"]["current"];
  group?: inferRouterOutputs<AppRouter>["group"]["get"];
  initialReceipt?: ParsedReceipt;
};

type SubmitMeta = { groupChoice?: "group" | "standalone" };
const defaultSubmitMeta: SubmitMeta = {};

export function ExpenseForm({
  currentParticipant,
  group,
  initialReceipt,
}: ExpenseFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupChoice, setGroupChoice] =
    useState<NonNullable<SubmitMeta["groupChoice"]>>("group");
  const groupParticipants = group?.participants ?? [currentParticipant];
  const [groupMemberEmails, setGroupMemberEmails] = useState<string[]>(() =>
    (group?.participants ?? []).map((participant) =>
      participant.email.toLowerCase(),
    ),
  );

  const findOutsideParticipants = (
    groupId: string | undefined,
    participants: FormParticipant[],
  ) => {
    if (!groupId) {
      return [];
    }

    const memberEmails = new Set(groupMemberEmails);

    return participants.filter(
      (participant) => !memberEmails.has(participant.email.toLowerCase()),
    );
  };

  const defaultValues: ExpenseFormValues = {
    totalMinor:
      initialReceipt?.totalMinor ??
      (initialReceipt
        ? (sumExpenseItemPrices(
            initialReceipt.items.map((item, index) =>
              createExpenseItem(item, `receipt_${index}`),
            ),
          ) ?? 0)
        : 0),
    title: "",
    splitMethod: initialReceipt ? "items" : splitMethods[0],
    payer: currentParticipant.email,
    group_id: group?.id,
    participants: groupParticipants.map(({ id, name, email, userId }) => ({
      id,
      name,
      email,
      userId: userId ?? undefined,
      owedMinor: 0,
      splitValue: 0,
      isSplitValueEdited: false,
      status: "unpaid",
    })),
    items:
      initialReceipt?.items.map((item, index) =>
        createExpenseItem(item, `receipt_${index}`),
      ) ?? [],
    occurredAt: Date.now(),
    currency: "PHP",
  };
  const router = useRouter();

  const createExpense = useMutation(trpc.expense.create.mutationOptions());

  const form = useForm({
    defaultValues,
    onSubmitMeta: defaultSubmitMeta,
    validators: {
      onChange: createExpenseSchema,
      onBlur: createExpenseSchema,
      onSubmit: createExpenseSchema,
    },
    onSubmitInvalid: () => {
      setHasSubmitted(true);
      setSubmitError(undefined);
      setIsGroupDialogOpen(false);
      Keyboard.dismiss();
    },
    onSubmit: async ({ value, meta }) => {
      // A selected group can only take the expense when every participant already
      // belongs to it. Otherwise the choice is a new group or a standalone expense.
      const needsGroupChoice =
        !value.group_id ||
        findOutsideParticipants(value.group_id, value.participants).length > 0;

      if (needsGroupChoice && !meta.groupChoice) {
        Keyboard.dismiss();
        setGroupChoice("group");
        setIsGroupDialogOpen(true);
        return;
      }

      setIsGroupDialogOpen(false);
      setSubmitError(undefined);
      const items =
        value.splitMethod === "items"
          ? (value.items ?? []).map((item) => ({
              name: item.name.trim(),
              quantity: item.quantity,
              priceMinor: item.priceMinor,
              participantEmail:
                item.participantEmail?.trim().toLowerCase() ?? "",
            }))
          : [];
      try {
        await createExpense.mutateAsync({
          ...value,
          title: value.title.trim(),
          items,
          groupId: needsGroupChoice ? undefined : value.group_id,
          createGroup: needsGroupChoice && meta.groupChoice === "group",
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.group.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.expense.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
        ]);
      } catch (error) {
        const code =
          error instanceof TRPCClientError ? error.data?.code : undefined;
        const description =
          code === "UNAUTHORIZED"
            ? "Your session has expired. Sign in again before submitting."
            : code === "FORBIDDEN" || code === "NOT_FOUND"
              ? "This group may no longer be available. Select another group or create a standalone expense."
              : code === "BAD_REQUEST"
                ? "Check the expense details and participant splits, then submit again."
                : "We couldn't confirm that your expense was saved. Check your connection and expense history before trying again.";

        setSubmitError(description);

        toast.show({
          duration: 6000,
          component: (props) => (
            <ExpenseCreationToast
              {...props}
              variant="danger"
              description={description}
            />
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
      setGroupMemberEmails(
        (group?.participants ?? []).map((participant) =>
          participant.email.toLowerCase(),
        ),
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
      if (group) {
        router.back();
      } else {
        router.push("/(tabs)/home");
      }
    },
  });

  const submit = (meta: SubmitMeta = defaultSubmitMeta) => {
    if (!form.state.isSubmitting && !selectGroup.isPending) {
      void form.handleSubmit(meta);
    }
  };

  const setTotalMinor = (totalMinor: number) => {
    form.setFieldValue("totalMinor", totalMinor);
    form.setFieldValue("participants", (participants) =>
      recalculateParticipants(
        participants,
        totalMinor,
        form.state.values.splitMethod,
        form.state.values.items ?? [],
      ),
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
    const validItems = clearInvalidItemAssignments(
      items,
      form.state.values.participants,
    );

    form.setFieldValue("items", validItems);
    form.setFieldValue(
      "participants",
      recalculateParticipants(
        form.state.values.participants,
        form.state.values.totalMinor,
        form.state.values.splitMethod,
        validItems,
      ),
    );
  };

  const selectGroup = useMutation({
    mutationFn: (groupId: string) =>
      queryClient.fetchQuery(trpc.group.get.queryOptions({ id: groupId })),
    onSuccess: (selectedGroup) => {
      form.setFieldValue("group_id", selectedGroup.id);
      setGroupMemberEmails(
        selectedGroup.participants.map((participant) =>
          participant.email.toLowerCase(),
        ),
      );
      const participants = selectedGroup.participants.map(
        ({ id, name, email, userId }): FormParticipant => ({
          id,
          name,
          email,
          userId: userId ?? undefined,
          owedMinor: 0,
          splitValue: 0,
          isSplitValueEdited: false,
          status: "unpaid",
        }),
      );
      if (
        !participants.some(
          (participant) => participant.email === form.state.values.payer,
        )
      ) {
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
    const participant = form.state.values.participants.find(
      (item) => item.id === participantId,
    );

    if (participant?.email === form.state.values.payer) {
      form.setFieldValue("payer", currentParticipant.email);
    }

    setParticipants(
      form.state.values.participants.filter(
        (item) => item.id !== participantId,
      ),
    );
  };

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      className="bg-background flex-1"
      contentContainerClassName="pt-safe pb-safe gap-4 px-4"
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <ExpenseFormHeader
            isSubmitting={isSubmitting || selectGroup.isPending}
            onSubmit={() => submit()}
          />
        )}
      </form.Subscribe>

      <form.Field name="totalMinor">
        {(field) => (
          <CurrencyInput
            value={field.state.value === 0 ? "" : String(field.state.value)}
            onBlur={field.handleBlur}
            errorMessage={
              hasSubmitted || field.state.meta.isBlurred
                ? createExpenseSchema.shape.totalMinor.safeParse(field.state.value)
                    .error?.issues[0]?.message
                : undefined
            }
            onValueChange={(value) =>
              setTotalMinor(value === "" ? 0 : Number(value))
            }
          />
        )}
      </form.Field>

      <form.Field name="title">
        {(field) => (
          <ExpenseTitleInput
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            errorMessage={
              hasSubmitted || field.state.meta.isBlurred
                ? createExpenseSchema.shape.title.safeParse(field.state.value)
                    .error?.issues[0]?.message
                : undefined
            }
          />
        )}
      </form.Field>

      <SectionHeader title="Split Method" />

      <form.Field name="splitMethod">
        {(field) => (
          <SplitMethodSelector
            value={field.state.value}
            onChange={setSplitMethod}
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          items: state.values.items ?? [],
          participants: state.values.participants,
          splitMethod: state.values.splitMethod,
          totalMinor: state.values.totalMinor,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ items, participants, splitMethod, totalMinor, isSubmitting }) => {
          if (splitMethod !== "items") {
            return null;
          }

          const itemTotal = sumExpenseItemPrices(items);
          const hasMismatch =
            itemTotal !== undefined && itemTotal !== totalMinor;

          return (
            <View className="gap-2">
              <SectionHeader title="Items" />
              <ExpenseItemList
                items={items}
                participants={participants}
                isDisabled={isSubmitting}
                showErrors={hasSubmitted}
                onAdd={() =>
                  setItems([
                    ...items,
                    createExpenseItem({ name: "", quantity: 1, priceMinor: 0 }),
                  ])
                }
                onChange={(index, item) => {
                  setItems(
                    items.map((current, itemIndex) =>
                      itemIndex === index ? item : current,
                    ),
                  );
                }}
                onRemove={(index) => {
                  setItems(items.filter((_, itemIndex) => itemIndex !== index));
                }}
              />
              {hasSubmitted && items.length === 0 ? (
                <Typography className="px-1 text-xs text-danger" selectable>
                  Add at least one item before submitting.
                </Typography>
              ) : hasMismatch ? (
                <Typography className="px-1 text-xs text-danger" selectable>
                  Items total {formatCurrency(itemTotal)} must match the expense
                  amount {formatCurrency(totalMinor)}.
                </Typography>
              ) : itemTotal === undefined && hasSubmitted ? (
                <Typography className="px-1 text-xs text-danger" selectable>
                  Enter valid line totals before submitting.
                </Typography>
              ) : null}
            </View>
          );
        }}
      </form.Subscribe>

      <SectionHeader title="Groups" />

      <form.Subscribe
        selector={(state) => ({
          groupId: state.values.group_id,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ groupId, isSubmitting }) => (
          <GroupSelector
            value={groupId}
            isDisabled={isSubmitting || selectGroup.isPending}
            onChange={(nextGroupId) => {
              if (
                nextGroupId === groupId ||
                isSubmitting ||
                selectGroup.isPending
              )
                return;
              selectGroup.reset();
              if (nextGroupId) {
                selectGroup.mutate(nextGroupId);
              } else {
                form.setFieldValue("group_id", undefined);
                setGroupMemberEmails([]);
              }
            }}
          />
        )}
      </form.Subscribe>
      {selectGroup.isPending && (
        <Typography className="text-xs text-muted">
          Loading group participants...
        </Typography>
      )}
      {selectGroup.isError && (
        <Typography className="text-xs text-danger">
          Unable to load this group. Tap the group to try again.
        </Typography>
      )}

      <SectionHeader
        title="Participants"
        action={
          <GuestDialog
            onSubmit={(guest) => {
              setParticipants([
                ...form.state.values.participants,
                {
                  ...guest,
                  id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                  owedMinor: 0,
                  splitValue: 0,
                  isSplitValueEdited: false,
                  status: "unpaid",
                },
              ]);
            }}
          />
        }
      />

      <form.Subscribe
        selector={(state) => ({
          participants: state.values.participants,
          payer: state.values.payer,
          splitMethod: state.values.splitMethod,
        })}
      >
        {({ participants, payer, splitMethod }) => (
          <ParticipantList
            participants={participants}
            payer={payer}
            splitMethod={splitMethod}
            currentParticipantId={currentParticipant.id}
            onPayerChange={(email) => form.setFieldValue("payer", email)}
            onRemove={removeParticipant}
            onSplitValueChange={setParticipantSplitValue}
          />
        )}
      </form.Subscribe>

      <Dialog isOpen={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content className="gap-5 rounded-3xl p-5">
            <View className="flex-row items-start gap-3">
              <View className="flex-1 gap-1">
                <Dialog.Title>Confirm Expense</Dialog.Title>
                <Dialog.Description>
                  Select what to do with this expense.
                </Dialog.Description>
              </View>
              <Button
                isIconOnly
                size="sm"
                variant="secondary"
                accessibilityLabel="Close expense confirmation"
                onPress={() => setIsGroupDialogOpen(false)}
              >
                <HugeiconsIcon icon={XIcon} />
              </Button>
            </View>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <>
                  <View className="gap-4" accessibilityRole="radiogroup">
                    <PressableFeedback
                      accessibilityRole="radio"
                      accessibilityState={{ checked: groupChoice === "group" }}
                      isDisabled={isSubmitting}
                      onPress={() => setGroupChoice("group")}
                      className={`gap-3 rounded-3xl border-2 bg-surface-secondary p-5 ${
                        groupChoice === "group"
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                    >
                      <Typography className="font-medium">
                        Create new group
                      </Typography>
                      <Typography className="text-muted leading-6">
                        Creates a new group with the selected participants and
                        adds this expense to it. The expense title will be the
                        group name.
                      </Typography>
                    </PressableFeedback>
                    <PressableFeedback
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: groupChoice === "standalone",
                      }}
                      isDisabled={isSubmitting}
                      onPress={() => setGroupChoice("standalone")}
                      className={`gap-3 rounded-3xl border-2 bg-surface-secondary p-5 ${
                        groupChoice === "standalone"
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                    >
                      <Typography className="font-medium">
                        Create standalone expense
                      </Typography>
                      <Typography className="text-muted leading-6">
                        Creates a one-off expense. This will only be available
                        on dashboard and history.
                      </Typography>
                    </PressableFeedback>
                  </View>
                  <Button
                    className="rounded-2xl bg-foreground"
                    isDisabled={isSubmitting}
                    onPress={() => submit({ groupChoice })}
                  >
                    <Button.Label className="text-background">
                      {isSubmitting ? "Creating expense..." : "Submit"}
                    </Button.Label>
                  </Button>
                </>
              )}
            </form.Subscribe>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </KeyboardAwareScrollView>
  );
}
