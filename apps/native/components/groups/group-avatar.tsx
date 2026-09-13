import { Avatar, Typography } from "heroui-native";

export type GroupAvatarPerson = {
  id: string;
  name: string;
  image: string | null;
};

export function GroupAvatar({
  person,
  className,
}: {
  person: GroupAvatarPerson;
  className?: string;
}) {
  return (
    <Avatar className={className} size="sm" alt={person.name}>
      {person.image && <Avatar.Image source={{ uri: person.image }} />}
      <Avatar.Fallback>
        <Typography className="text-xs text-ink">
          {person.name.slice(0, 1).toUpperCase()}
        </Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}
