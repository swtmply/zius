import { X } from "@hugeicons/core-free-icons";
import { Button, Typography } from "heroui-native";
import type { ReactNode } from "react";
import { View } from "react-native";

import { Icon } from "@/components/icon";
import { GroupAvatar } from "@/components/groups/group-avatar";

import type { GroupFormParticipant } from "@/utils/groups/group-form";

type GroupParticipantListProps = {
  participants: GroupFormParticipant[];
  currentParticipantId: string;
  onRemove: (participantId: string) => void;
  reuseAction: ReactNode;
  isDisabled?: boolean;
};

export function GroupParticipantList({
  participants,
  currentParticipantId,
  onRemove,
  reuseAction,
  isDisabled = false,
}: GroupParticipantListProps) {
  return (
    <View className="gap-3 rounded-2xl bg-panel p-4">
      {participants.map((participant) => (
        <View key={participant.id} className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <GroupAvatar
              person={{
                id: participant.id,
                name: participant.name,
                image: participant.image ?? null,
              }}
              className="size-8 bg-page"
            />
            <Typography className="flex-1 text-sm text-ink" numberOfLines={1}>
              {participant.name}
            </Typography>
          </View>
          <Button
            isIconOnly
            variant="secondary"
            className="size-8 rounded-full bg-page"
            isDisabled={isDisabled || participant.id === currentParticipantId}
            accessibilityLabel={`Remove ${participant.name}`}
            onPress={() => onRemove(participant.id)}
          >
            <Icon icon={X} size={16} colorClassName="accent-muted" />
          </Button>
        </View>
      ))}
      {reuseAction}
    </View>
  );
}
