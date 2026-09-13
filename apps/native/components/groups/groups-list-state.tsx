import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { GroupsLoading } from "@/components/groups/groups-loading";

export function GroupsEmptyState() {
  return (
    <View className="items-center gap-1 rounded-2xl bg-panel p-6">
      <Typography selectable className="text-sm font-semibold text-ink">
        No groups
      </Typography>
      <Typography selectable className="text-xs text-supporting">
        No groups match these filters.
      </Typography>
    </View>
  );
}

export function GroupsQueryFooter({
  hasGroups,
  hasNextPage,
  isError,
  isFetchNextPageError,
  isFetchingNextPage,
  onRetry,
}: {
  hasGroups: boolean;
  hasNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  onRetry: () => void;
}) {
  if (isError || isFetchNextPageError) {
    return (
      <View className="items-center gap-4 py-6">
        <Typography selectable className="text-xs text-supporting">
          Unable to load groups.
        </Typography>
        <Button variant="secondary" size="sm" onPress={onRetry}>
          <Button.Label>Try again</Button.Label>
        </Button>
      </View>
    );
  }

  if (isFetchingNextPage) {
    return (
      <View className="pt-3">
        <GroupsLoading count={2} />
      </View>
    );
  }

  if (hasGroups && !hasNextPage) {
    return <Typography className="py-4 text-center text-xs text-supporting">No more.</Typography>;
  }

  return null;
}
