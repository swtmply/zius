import { X } from "@hugeicons/core-free-icons";
import { Avatar, Button, PressableFeedback, Typography } from "heroui-native";
import { View } from "react-native";

import { ParticipantSplitInput } from "./expense-participant-split-input";
import { Icon } from "@/components/icon";
import type { FormParticipant, SplitMethod } from "@/utils/expenses/expense-form";

type ParticipantListProps = {
  participants: FormParticipant[];
  payer: string;
  splitMethod: SplitMethod;
  currentParticipantId: string;
  onPayerChange: (email: string) => void;
  onRemove: (participantId: string) => void;
  onSplitValueChange: (participantId: string, value: number) => void;
};

function ParticipantAvatar({ participant }: { participant: FormParticipant }) {
  return (
    <Avatar className="size-8 bg-page" size="sm" alt={participant.name}>
      {participant.image ? <Avatar.Image source={{ uri: participant.image }} /> : null}
      <Avatar.Fallback>
        <Typography className="text-xs text-ink">
          {participant.name.slice(0, 1).toUpperCase()}
        </Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}

export function ParticipantList({
  participants,
  payer,
  splitMethod,
  currentParticipantId,
  onPayerChange,
  onRemove,
  onSplitValueChange,
}: ParticipantListProps) {
  return (
    <View className="rounded-2xl bg-panel px-4">
      {participants.length === 0 ? (
        <Typography className="py-4 text-center text-xs text-supporting">
          Add at least one participant to split this expense.
        </Typography>
      ) : (
        participants.map((participant, index) => {
          const isPayer = participant.email.toLowerCase() === payer.toLowerCase();

          return (
            <View
              key={participant.id}
              className={`flex-row items-center gap-2 py-2${index > 0 ? " border-t border-dashed border-border" : ""}`}
            >
              <PressableFeedback
                accessibilityLabel={`Select ${participant.name} as payer`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isPayer }}
                className="min-w-0 flex-1 flex-row items-center gap-2 rounded-xl"
                hitSlop={8}
                onPress={() => onPayerChange(participant.email)}
              >
                <ParticipantAvatar participant={participant} />
                <Typography selectable className="shrink text-sm text-ink" numberOfLines={1}>
                  {participant.name}
                </Typography>
              </PressableFeedback>

              <View className="shrink-0 flex-row items-center gap-1">
                <ParticipantSplitInput
                  participantName={participant.name}
                  splitMethod={splitMethod}
                  value={
                    splitMethod === "equal" || splitMethod === "items"
                      ? participant.owedMinor
                      : participant.splitValue
                  }
                  onValueChange={(value) => onSplitValueChange(participant.id, value)}
                />
                <Button
                  isIconOnly
                  variant="ghost"
                  className={`size-7 rounded-full${
                    participant.id === currentParticipantId ? " opacity-40" : ""
                  }`}
                  isDisabled={participant.id === currentParticipantId}
                  accessibilityLabel={`Remove ${participant.name}`}
                  onPress={() => onRemove(participant.id)}
                >
                  <Icon icon={X} size={16} colorClassName="accent-muted" />
                </Button>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
