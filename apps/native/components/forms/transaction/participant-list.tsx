import { X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Avatar, Button, PressableFeedback, Typography } from "heroui-native";
import { View } from "react-native";

import { ParticipantSplitInput } from "./participant-split-input";
import type { FormParticipant, SplitMethod } from "./transaction-form-model";

type ParticipantListProps = {
  participants: FormParticipant[];
  payer: string;
  splitMethod: SplitMethod;
  currentParticipantId: string;
  onPayerChange: (email: string) => void;
  onRemove: (participantId: string) => void;
  onSplitValueChange: (participantId: string, value: number) => void;
};

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
    <View className="gap-4">
      {participants.map((participant) => {
        const isPayer = participant.email === payer;

        return (
          <View key={participant.id} className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-1">
              <PressableFeedback
                accessibilityLabel={`Select ${participant.name} as payer`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isPayer }}
                className="flex-row items-center gap-1 rounded-xl"
                hitSlop={8}
                onPress={() => onPayerChange(participant.email)}
              >
                <Avatar size="sm">
                  <Avatar.Fallback>{participant.name[0]}</Avatar.Fallback>
                </Avatar>
                <Typography className="text-sm">{participant.name}</Typography>
              </PressableFeedback>
              {isPayer ? (
                <View className="bg-accent rounded-full px-2">
                  <Typography type="body-xs" className="text-accent-foreground">
                    Payer
                  </Typography>
                </View>
              ) : null}
            </View>

            <View className="flex-row items-center gap-1">
              <ParticipantSplitInput
                participantName={participant.name}
                splitMethod={splitMethod}
                value={splitMethod === "equal" ? participant.owedMinor : participant.splitValue}
                onValueChange={(value) => onSplitValueChange(participant.id, value)}
              />
              <Button
                isIconOnly
                variant="danger"
                className="size-8"
                isDisabled={participant.id === currentParticipantId}
                onPress={() => onRemove(participant.id)}
              >
                <HugeiconsIcon icon={X} size={16} color="#ffffff" />
              </Button>
            </View>
          </View>
        );
      })}
    </View>
  );
}
