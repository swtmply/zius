import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { Pressable, View } from "react-native";
import { Typography } from "heroui-native";

import { GroupAvatar } from "@/components/groups/group-avatar";

type GroupListItem = inferRouterOutputs<AppRouter>["group"]["list"]["items"][number];

export function GroupCard({ group, onPress }: { group: GroupListItem; onPress: () => void }) {
  const visibleParticipants = group.participants.slice(0, 3);
  const remainingParticipants = group.participants.length - visibleParticipants.length;

  return (
    <Pressable
      className="active:opacity-70"
      accessibilityRole="button"
      accessibilityLabel={`Open ${group.name}${group.archivedAt ? ", Archived" : ""}`}
      onPress={onPress}
    >
      <View className="bg-panel rounded-2xl p-4 gap-3">
        <View className="flex-row items-center justify-between gap-2">
          <Typography selectable className="flex-1 text-sm text-ink" numberOfLines={1}>
            {group.name}
          </Typography>
          {group.archivedAt ? (
            <View className="rounded-full bg-page px-2 py-1">
              <Typography className="text-[10px] text-supporting">Archived</Typography>
            </View>
          ) : null}
        </View>

        <View className="border-t border-dashed border-border pt-3">
          <View className="flex-row items-center gap-1">
            {visibleParticipants.map((participant) => (
              <View key={participant.id} className="rounded-full border-2 border-panel">
                <GroupAvatar person={participant} className="size-8 bg-page" />
              </View>
            ))}
            {remainingParticipants > 0 ? (
              <View
                className="size-8 items-center justify-center rounded-full border-2 border-panel bg-page"
                accessibilityLabel={`${remainingParticipants} more participants`}
              >
                <Typography className="text-xs text-ink">{remainingParticipants}+</Typography>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
