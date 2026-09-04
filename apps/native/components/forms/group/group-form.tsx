import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { useRouter } from "expo-router";
import { Button, Typography, useToast } from "heroui-native";
import { Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { BillCreationToast } from "@/components/bill-creation-toast";
import { trpc } from "@/utils/trpc";

import { GuestDialog } from "../transaction/guest-dialog";
import { TransactionTitleInput } from "../transaction/transaction-title-input";
import { GroupFormHeader } from "./group-form-header";
import {
  createGroupSchema,
  type GroupFormParticipant,
  type GroupFormValues,
} from "./group-form-model";
import { GroupParticipantList } from "./group-participant-list";

type GroupFormProps = {
  currentParticipant: inferRouterOutputs<AppRouter>["participant"]["current"];
};

export function GroupForm({ currentParticipant }: GroupFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [participantError, setParticipantError] = useState<string>();
  const createGroup = useMutation(trpc.group.create.mutationOptions());

  const defaultValues: GroupFormValues = {
    name: "",
    participants: [
      {
        id: currentParticipant.id,
        name: currentParticipant.name,
        email: currentParticipant.email,
        userId: currentParticipant.userId,
      },
    ],
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: createGroupSchema,
    },
    onSubmit: async ({ value }) => {
      Keyboard.dismiss();

      try {
        await createGroup.mutateAsync({
          name: value.name.trim(),
          participants: value.participants
            .filter((participant) => participant.id !== currentParticipant.id)
            .map(({ id, name, email }) => ({ id, name, email })),
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.group.list.pathKey() }),
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
            <BillCreationToast
              {...props}
              variant="danger"
              title="Failed to create group"
              description={description}
            />
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
            title="Group created successfully"
            description="Your group has been created."
          />
        ),
      });
      router.back();
    },
  });

  const submit = () => {
    if (!form.state.isSubmitting) {
      void form.handleSubmit();
    }
  };

  const setParticipants = (participants: GroupFormParticipant[]) => {
    form.setFieldValue("participants", participants);
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
        {(isSubmitting) => <GroupFormHeader isSubmitting={isSubmitting} onSubmit={submit} />}
      </form.Subscribe>

      <form.Field name="name">
        {(field) => (
          <View className="gap-1">
            <TransactionTitleInput
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              onSubmit={submit}
              label="Name"
              placeholder="Group name"
            />
            {field.state.meta.errors.map((error) => (
              <Typography key={error?.message} className="px-1 text-xs text-danger">
                {error?.message}
              </Typography>
            ))}
          </View>
        )}
      </form.Field>

      <SectionHeader
        title="Participants"
        action={
          <GuestDialog
            onSubmit={(guest) => {
              if (
                form.state.values.participants.some(
                  (participant) => participant.email.toLowerCase() === guest.email.toLowerCase(),
                )
              ) {
                setParticipantError("Each participant can only appear once");
                return;
              }

              const participantId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
              setParticipantError(undefined);
              setParticipants([...form.state.values.participants, { ...guest, id: participantId }]);
            }}
          />
        }
      />

      <form.Subscribe selector={(state) => state.values.participants}>
        {(participants) => (
          <GroupParticipantList
            participants={participants}
            currentParticipantId={currentParticipant.id}
            onRemove={(participantId) => {
              setParticipantError(undefined);
              setParticipants(
                participants.filter((participant) => participant.id !== participantId),
              );
            }}
          />
        )}
      </form.Subscribe>

      {participantError ? (
        <Typography className="px-1 text-xs text-danger">{participantError}</Typography>
      ) : null}

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button className="mt-2" isDisabled={isSubmitting} onPress={submit}>
            <Button.Label>Create group</Button.Label>
          </Button>
        )}
      </form.Subscribe>
    </KeyboardAwareScrollView>
  );
}
