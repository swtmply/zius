import { View } from "react-native";
import { SectionHeader } from "@/components/layout/section-header";
import { GuestDialog } from "./expense-guest-dialog";
import { ParticipantList } from "./expense-participant-list";
import { ExpenseFormSubscribe } from "./expense-form-subscribe";
import { useExpenseForm } from "./expense-form-context";

export function ExpenseFormParticipants() {
  const { form, currentParticipant, setParticipants, removeParticipant, setParticipantSplitValue } =
    useExpenseForm();
  return (
    <ExpenseFormSubscribe
      form={form}
      selector={(state) =>
        [state.values.participants, state.values.payer, state.values.splitMethod] as const
      }
    >
      {([participants, payer, splitMethod]) => (
        <View className="gap-2">
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
            }
          />
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
      )}
    </ExpenseFormSubscribe>
  );
}
