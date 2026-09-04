import { X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Avatar, Button, Typography } from "heroui-native";
import { View } from "react-native";

import type { GroupFormParticipant } from "./group-form-model";

type GroupParticipantListProps = {
  participants: GroupFormParticipant[];
  currentParticipantId: string;
  onRemove: (participantId: string) => void;
};

export function GroupParticipantList({
  participants,
  currentParticipantId,
  onRemove,
}: GroupParticipantListProps) {
  return (
    <View className="gap-4">
      {participants.map((participant) => (
        <View key={participant.id} className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Avatar size="sm">
              <Avatar.Fallback>{participant.name[0]}</Avatar.Fallback>
            </Avatar>
            <View>
              <Typography className="text-sm">{participant.name}</Typography>
              <Typography className="text-xs text-muted">{participant.email}</Typography>
            </View>
          </View>
          <Button
            isIconOnly
            variant="danger"
            className="size-8"
            isDisabled={participant.id === currentParticipantId}
            accessibilityLabel={`Remove ${participant.name}`}
            onPress={() => onRemove(participant.id)}
          >
            <HugeiconsIcon icon={X} size={16} color="#ffffff" />
          </Button>
        </View>
      ))}
    </View>
  );
}
