import type { HugeiconsProps } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Avatar, Typography } from "heroui-native";
import { View } from "react-native";

export type ActionParticipant = {
  name: string;
  image?: string | null;
};

type ExpenseActionTileContentProps = {
  icon?: HugeiconsProps["icon"];
  label: string;
  participant?: ActionParticipant;
  labelClassName?: string;
  adjustsFontSizeToFit?: boolean;
};

function ParticipantAvatar({ participant }: { participant: ActionParticipant }) {
  return (
    <Avatar className="size-12 bg-page" size="sm" alt={participant.name}>
      {participant.image ? <Avatar.Image source={{ uri: participant.image }} /> : null}
      <Avatar.Fallback>
        <Typography className="text-sm text-ink">
          {participant.name.slice(0, 1).toUpperCase()}
        </Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}

export function ExpenseActionTileContent({
  icon,
  label,
  participant,
  labelClassName = "max-w-full text-center text-xs text-ink",
  adjustsFontSizeToFit = true,
}: ExpenseActionTileContentProps) {
  return (
    <>
      {participant ? (
        <ParticipantAvatar participant={participant} />
      ) : (
        <View className="size-12 items-center justify-center rounded-full bg-page">
          {icon ? <HugeiconsIcon icon={icon} size={24} color="#000000" /> : null}
        </View>
      )}
      <Typography
        adjustsFontSizeToFit={adjustsFontSizeToFit}
        className={labelClassName}
        ellipsizeMode="tail"
        minimumFontScale={adjustsFontSizeToFit ? 0.85 : undefined}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </>
  );
}
