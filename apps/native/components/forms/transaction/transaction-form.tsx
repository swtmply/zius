import { BillCreationToast } from "@/components/bill-creation-toast";
import { SectionHeader } from "@/components/section-header";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { Button, Dialog, Typography, useToast } from "heroui-native";
import { useState } from "react";
import { Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { CurrencyInput } from "./currency-input";
import { GuestDialog } from "./guest-dialog";
import { GroupSelector } from "./group-selector";
import { ParticipantList } from "./participant-list";
import { SplitMethodSelector } from "./split-method-selector";
import { TransactionFormHeader } from "./transaction-form-header";
import {
  createTransactionSchema,
  recalculateParticipants,
  splitMethods,
  type FormParticipant,
  type SplitMethod,
  type TransactionFormValues,
} from "./transaction-form-model";
import { TransactionTitleInput } from "./transaction-title-input";
import { trpc } from "@/utils/trpc";
import { useRouter } from "expo-router";

type TransactionFormProps = {
  currentParticipant: inferRouterOutputs<AppRouter>["participant"]["current"];
  group?: inferRouterOutputs<AppRouter>["group"]["get"];
};

type SubmitMeta = { groupChoice?: "group" | "standalone" };
const defaultSubmitMeta: SubmitMeta = {};

export function TransactionForm({ currentParticipant, group }: TransactionFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const groupParticipants = group?.participants ?? [currentParticipant];
  const defaultValues: TransactionFormValues = {
    totalMinor: 0,
    title: "",
    splitMethod: splitMethods[0],
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
    occurredAt: Date.now(),
    currency: "PHP",
  };
  const router = useRouter();

  const createBill = useMutation(trpc.bill.create.mutationOptions());

  const form = useForm({
    defaultValues,
    onSubmitMeta: defaultSubmitMeta,
    validators: {
      onSubmit: createTransactionSchema,
    },
    onSubmit: async ({ value, meta }) => {
      if (!value.group_id && !meta.groupChoice) {
        Keyboard.dismiss();
        setIsGroupDialogOpen(true);
        return;
      }

      setIsGroupDialogOpen(false);
      try {
        await createBill.mutateAsync({
          ...value,
          groupId: value.group_id,
          createGroup: !value.group_id && meta.groupChoice === "group",
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.group.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.bill.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
        ]);
      } catch (error) {
        const description =
          error instanceof Error && error.message.trim()
            ? error.message
            : "Something went wrong. Please try again.";

        toast.show({
          duration: 6000,
          component: (props) => (
            <BillCreationToast {...props} variant="danger" description={description} />
          ),
        });
        return;
      }

      form.reset();
      toast.show({
        component: (props) => (
          <BillCreationToast
            {...props}
            variant="success"
            description="Your bill has been created."
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
      recalculateParticipants(participants, totalMinor, form.state.values.splitMethod),
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
      ),
    );
  };

  const setParticipants = (participants: FormParticipant[]) => {
    form.setFieldValue(
      "participants",
      recalculateParticipants(
        participants,
        form.state.values.totalMinor,
        form.state.values.splitMethod,
      ),
    );
  };

  const selectGroup = useMutation({
    mutationFn: (groupId: string) =>
      queryClient.fetchQuery(trpc.group.get.queryOptions({ id: groupId })),
    onSuccess: (selectedGroup) => {
      form.setFieldValue("group_id", selectedGroup.id);
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
      className="bg-background flex-1"
      contentContainerClassName="pt-safe pb-safe gap-4 px-4"
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
    >
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <TransactionFormHeader
            isSubmitting={isSubmitting || selectGroup.isPending}
            onSubmit={() => submit()}
          />
        )}
      </form.Subscribe>

      <form.Field name="totalMinor">
        {(field) => (
          <CurrencyInput
            value={field.state.value === 0 ? "" : String(field.state.value)}
            onValueChange={(value) => setTotalMinor(value === "" ? 0 : Number(value))}
          />
        )}
      </form.Field>

      <form.Field name="title">
        {(field) => (
          <TransactionTitleInput
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={field.handleChange}
            onSubmit={() => submit()}
          />
        )}
      </form.Field>

      <SectionHeader title="Split Method" />

      <form.Field name="splitMethod">
        {(field) => <SplitMethodSelector value={field.state.value} onChange={setSplitMethod} />}
      </form.Field>

      <SectionHeader title="Groups" />

      <form.Subscribe
        selector={(state) => ({ groupId: state.values.group_id, isSubmitting: state.isSubmitting })}
      >
        {({ groupId, isSubmitting }) => (
          <GroupSelector
            value={groupId}
            isDisabled={isSubmitting || selectGroup.isPending}
            onChange={(nextGroupId) => {
              if (nextGroupId === groupId || isSubmitting || selectGroup.isPending) return;
              selectGroup.reset();
              if (nextGroupId) {
                selectGroup.mutate(nextGroupId);
              } else {
                form.setFieldValue("group_id", undefined);
              }
            }}
          />
        )}
      </form.Subscribe>
      {selectGroup.isPending && (
        <Typography className="text-xs text-muted">Loading group participants...</Typography>
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
          <Dialog.Content>
            <View className="mb-5 gap-1">
              <Dialog.Title>Create a group?</Dialog.Title>
              <Dialog.Description>
                Create a group with these participants, or save a standalone expense. The group will
                use the expense title as its name.
              </Dialog.Description>
            </View>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <View className="gap-1">
                  <Button
                    isDisabled={isSubmitting}
                    onPress={() => submit({ groupChoice: "group" })}
                  >
                    <Button.Label>Create group</Button.Label>
                  </Button>
                  <Button
                    variant="secondary"
                    isDisabled={isSubmitting}
                    onPress={() => submit({ groupChoice: "standalone" })}
                  >
                    <Button.Label>Standalone expense</Button.Label>
                  </Button>
                  <Button variant="ghost" onPress={() => setIsGroupDialogOpen(false)}>
                    <Button.Label>Cancel</Button.Label>
                  </Button>
                </View>
              )}
            </form.Subscribe>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </KeyboardAwareScrollView>
  );
}
