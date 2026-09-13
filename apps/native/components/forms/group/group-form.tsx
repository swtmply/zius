import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { useRouter } from "expo-router";
import { Typography, useToast } from "heroui-native";
import { Keyboard, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useState } from "react";

import { SectionHeader } from "@/components/section-header";
import { ExpenseCreationToast } from "@/components/expense-creation-toast";
import { trpc } from "@/utils/trpc";

import { GuestDialog } from "../expense/guest-dialog";
import { ExpenseTitleInput } from "../expense/expense-title-input";
import { GroupFormHeader } from "./group-form-header";
import { GroupPickerSelect } from "./group-picker-dialog";
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
  const [sourceGroupError, setSourceGroupError] = useState<string>();
  const createGroup = useMutation(trpc.group.create.mutationOptions());

  const currentFormParticipant: GroupFormParticipant = {
    id: currentParticipant.id,
    name: currentParticipant.name,
    email: currentParticipant.email,
    userId: currentParticipant.userId,
    image: null,
  };

  const defaultValues: GroupFormValues = {
    name: "",
    participants: [currentFormParticipant],
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
          queryClient.invalidateQueries({
            queryKey: trpc.group.list.pathKey(),
          }),
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
            <ExpenseCreationToast
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
      setSourceGroupError(undefined);
      setParticipantError(undefined);
      toast.show({
        component: (props) => (
          <ExpenseCreationToast
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
    if (!form.state.isSubmitting && !reuseGroupParticipants.isPending) {
      void form.handleSubmit();
    }
  };

  const setParticipants = (participants: GroupFormParticipant[]) => {
    form.setFieldValue("participants", participants);
  };

  const reuseGroupParticipants = useMutation({
    mutationFn: (groupId: string) =>
      queryClient.fetchQuery(trpc.group.get.queryOptions({ id: groupId })),
    onSuccess: (sourceGroup) => {
      setParticipantError(undefined);
      setParticipants([
        currentFormParticipant,
        ...sourceGroup.participants
          .filter((participant) => participant.id !== currentParticipant.id)
          .map(({ id, name, email, image, userId }) => ({
            id,
            name,
            email,
            userId: userId ?? undefined,
            image,
          })),
      ]);
    },
    onError: () => {
      setSourceGroupError("Unable to load that group's participants. Select it again to retry.");
    },
  });

  const reuseGroup = (groupId: string | undefined, isSubmitting: boolean) => {
    if (isSubmitting || reuseGroupParticipants.isPending) return;

    setSourceGroupError(undefined);

    if (!groupId) {
      setParticipantError(undefined);
      setParticipants([currentFormParticipant]);
      return;
    }

    reuseGroupParticipants.mutate(groupId);
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
          <GroupFormHeader
            isDisabled={isSubmitting || reuseGroupParticipants.isPending}
            onSubmit={submit}
          />
        )}
      </form.Subscribe>

      <form.Field name="name">
        {(field) => (
          <View className="gap-1">
            <ExpenseTitleInput
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              label="Name"
              placeholder="Group Name"
              errorMessage={field.state.meta.errors[0]?.message}
            />
          </View>
        )}
      </form.Field>

      <form.Subscribe
        selector={(state) => ({
          participants: state.values.participants,
          isSubmitting: state.isSubmitting,
        })}
      >
        {({ participants, isSubmitting }) => (
          <>
            <SectionHeader
              title="Participants"
              action={
                <GuestDialog
                  title="Add Participant"
                  triggerLabel="Add Participant"
                  submitLabel="Submit"
                  namePlaceholder="Participant Name"
                  emailPlaceholder="Participant Email"
                  onSubmit={(guest) => {
                    if (
                      participants.some(
                        (participant) =>
                          participant.email.toLowerCase() === guest.email.toLowerCase(),
                      )
                    ) {
                      setParticipantError("Each participant can only appear once");
                      return;
                    }

                    const participantId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                    setParticipantError(undefined);
                    setParticipants([...participants, { ...guest, id: participantId }]);
                  }}
                />
              }
            />

            <GroupParticipantList
              participants={participants}
              currentParticipantId={currentParticipant.id}
              isDisabled={isSubmitting || reuseGroupParticipants.isPending}
              reuseAction={
                <GroupPickerSelect
                  isDisabled={isSubmitting || reuseGroupParticipants.isPending}
                  onSubmit={(groupId) => reuseGroup(groupId, isSubmitting)}
                />
              }
              onRemove={(participantId) => {
                setParticipantError(undefined);
                setParticipants(
                  participants.filter((participant) => participant.id !== participantId),
                );
              }}
            />

            {reuseGroupParticipants.isPending ? (
              <Typography className="px-1 text-xs text-supporting">
                Loading group participants...
              </Typography>
            ) : null}
            {sourceGroupError ? (
              <Typography className="px-1 text-xs text-danger">{sourceGroupError}</Typography>
            ) : null}
            {participantError ? (
              <Typography className="px-1 text-xs text-danger">{participantError}</Typography>
            ) : null}
          </>
        )}
      </form.Subscribe>
    </KeyboardAwareScrollView>
  );
}
