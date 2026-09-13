import { ExpenseCreationToast } from "@/components/expense-creation-toast";
import { SectionHeader } from "@/components/section-header";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "@zius/api/routers/index";
import { Button, BottomSheet, PressableFeedback, Typography, useToast } from "heroui-native";
import { useState } from "react";
import { Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CurrencyInput } from "./currency-input";
import { ExpenseFormActions, type ExpenseCategory } from "./expense-form-actions";
import { GuestDialog } from "./guest-dialog";
import { ParticipantList } from "./participant-list";
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
import { Add, XIcon } from "@hugeicons/core-free-icons";

type ExpenseFormProps = {
  currentParticipant: inferRouterOutputs<AppRouter>["participant"]["current"];
  group?: inferRouterOutputs<AppRouter>["group"]["get"];
  initialReceipt?: ParsedReceipt;
};

type SubmitMeta = { groupChoice?: "group" | "standalone" };
const defaultSubmitMeta: SubmitMeta = {};

export function ExpenseForm({ currentParticipant, group, initialReceipt }: ExpenseFormProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupChoice, setGroupChoice] = useState<NonNullable<SubmitMeta["groupChoice"]>>("group");
  const [category, setCategory] = useState<ExpenseCategory>();
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
    validators: {
      onChange: createExpenseSchema,
      onBlur: createExpenseSchema,
      onSubmit: createExpenseSchema,
    },
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
      try {
        await createExpense.mutateAsync({
          ...value,
          title: value.title.trim(),
          category: category ?? "others",
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
      setCategory(undefined);
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
    const validItems = clearInvalidItemAssignments(items, form.state.values.participants);

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

  return (
    <KeyboardAwareScrollView
      bottomOffset={16}
      className="bg-page flex-1"
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
                ? createExpenseSchema.shape.totalMinor.safeParse(field.state.value).error?.issues[0]
                    ?.message
                : undefined
            }
            onValueChange={(value) => setTotalMinor(value === "" ? 0 : Number(value))}
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
                ? createExpenseSchema.shape.title.safeParse(field.state.value).error?.issues[0]
                    ?.message
                : undefined
            }
          />
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          participants: state.values.participants,
          payer: state.values.payer,
          groupId: state.values.group_id,
          splitMethod: state.values.splitMethod,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ participants, payer, groupId, splitMethod, isSubmitting }) => (
          <>
            <ExpenseFormActions
              participants={participants}
              payer={payer}
              splitMethod={splitMethod}
              groupId={groupId}
              groupName={group?.name}
              category={category}
              isDisabled={isSubmitting || selectGroup.isPending}
              onPayerChange={(email) => form.setFieldValue("payer", email)}
              onSplitMethodChange={setSplitMethod}
              onGroupChange={(nextGroupId) => {
                if (nextGroupId === groupId || isSubmitting || selectGroup.isPending) return;
                selectGroup.reset();
                if (nextGroupId) {
                  selectGroup.mutate(nextGroupId);
                } else {
                  form.setFieldValue("group_id", undefined);
                  setGroupMemberEmails([]);
                }
              }}
              onCategoryChange={setCategory}
            />
            {selectGroup.isPending ? (
              <Typography className="px-1 text-xs text-supporting">
                Loading group participants...
              </Typography>
            ) : null}
            {selectGroup.isError ? (
              <Typography className="px-1 text-xs text-danger">
                Unable to load this group. Open Groups to try again.
              </Typography>
            ) : null}
          </>
        )}
      </form.Subscribe>

      <form.Subscribe
        selector={(state) => ({
          items: state.values.items ?? [],
          participants: state.values.participants,
          payer: state.values.payer,
          splitMethod: state.values.splitMethod,
          totalMinor: state.values.totalMinor,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ items, participants, payer, splitMethod, totalMinor, isSubmitting }) => {
          const itemTotal = sumExpenseItemPrices(items);
          const hasMismatch = itemTotal !== undefined && itemTotal !== totalMinor;

          return (
            <View className="gap-2">
              <SectionHeader
                title="Expense Summary"
                action={
                  <View className="flex-row items-center gap-1">
                    <GuestDialog
                      title="Add Participant"
                      triggerLabel="Add Participant"
                      submitLabel="Submit"
                      namePlaceholder="Participant Name"
                      emailPlaceholder="Participant Email"
                      onSubmit={(guest) => {
                        setParticipants([
                          ...participants,
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
                    {splitMethod === "items" ? (
                      <Button
                        size="sm"
                        className="h-8 min-h-0 gap-2 rounded-full bg-dark-gradient px-3"
                        isDisabled={isSubmitting}
                        onPress={() =>
                          setItems([
                            ...items,
                            createExpenseItem({ name: "", quantity: 1, priceMinor: 0 }),
                          ])
                        }
                      >
                        <HugeiconsIcon icon={Add} size={16} color="#FFFFFF" />
                        <Button.Label className="text-xs font-normal text-white">
                          Add Item
                        </Button.Label>
                      </Button>
                    ) : null}
                  </View>
                }
              />

              {splitMethod === "items" ? (
                <>
                  <ExpenseItemList
                    items={items}
                    participants={participants}
                    isDisabled={isSubmitting}
                    showErrors={hasSubmitted}
                    onChange={(index, item) => {
                      setItems(
                        items.map((current, itemIndex) => (itemIndex === index ? item : current)),
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
                      Items total {formatCurrency(itemTotal)} must match the expense amount{" "}
                      {formatCurrency(totalMinor)}.
                    </Typography>
                  ) : itemTotal === undefined && hasSubmitted ? (
                    <Typography className="px-1 text-xs text-danger" selectable>
                      Enter valid line totals before submitting.
                    </Typography>
                  ) : null}
                </>
              ) : null}

              <ParticipantList
                participants={participants}
                payer={payer}
                splitMethod={splitMethod}
                currentParticipantId={currentParticipant.id}
                onPayerChange={(email) => form.setFieldValue("payer", email)}
                onRemove={removeParticipant}
                onSplitValueChange={setParticipantSplitValue}
              />
            </View>
          );
        }}
      </form.Subscribe>

      <BottomSheet isOpen={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            detached
            bottomInset={insets.bottom + 12}
            className="mx-4 overflow-hidden"
            backgroundClassName="rounded-3xl"
            contentContainerClassName="gap-5 p-5"
            enableDynamicSizing
            handleComponent={null}
          >
            <View className="flex-row items-start gap-3">
              <View className="flex-1 gap-1">
                <BottomSheet.Title>Confirm Expense</BottomSheet.Title>
                <BottomSheet.Description>
                  Select what to do with this expense.
                </BottomSheet.Description>
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
                        groupChoice === "group" ? "border-foreground" : "border-transparent"
                      }`}
                    >
                      <Typography className="font-medium">Create new group</Typography>
                      <Typography className="text-muted leading-6">
                        Creates a new group with the selected participants and adds this expense to
                        it. The expense title will be the group name.
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
                        groupChoice === "standalone" ? "border-foreground" : "border-transparent"
                      }`}
                    >
                      <Typography className="font-medium">Create standalone expense</Typography>
                      <Typography className="text-muted leading-6">
                        Creates a one-off expense. This will only be available on dashboard and
                        history.
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
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </KeyboardAwareScrollView>
  );
}
