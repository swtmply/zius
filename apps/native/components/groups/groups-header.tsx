import { Add, ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import {
  GroupFilters,
  type GroupSort,
  type GroupStatus,
  type GroupType,
} from "@/components/groups/group-filters";

function getGroupsSubtitle({
  status,
  sort,
  type,
}: {
  status: GroupStatus;
  sort: GroupSort;
  type: GroupType;
}) {
  const sortLabel = sort === "newest" ? "Newest" : "Oldest";
  const statusLabel = status === "active" ? "Active" : status === "archived" ? "Archived" : "All";
  const typeLabel = type === "owner" ? " You Own" : type === "member" ? " Shared With You" : "";

  return `${sortLabel} ${statusLabel} Groups${typeLabel}`;
}

export function GroupsHeader({
  status,
  sort,
  type,
}: {
  status: GroupStatus;
  sort: GroupSort;
  type: GroupType;
}) {
  const router = useRouter();

  return (
    <View className="gap-2 pt-safe pb-2">
      <View className="flex-row items-center justify-between gap-4 py-4">
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        >
          <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} color="#000000" />
        </Button>
        <Typography className="flex-1 text-2xl font-semibold text-ink">Groups</Typography>
        <View className="flex-row items-center gap-2">
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="Create group"
            onPress={() => router.push("/create-group")}
          >
            <HugeiconsIcon icon={Add} size={24} color="#000000" />
          </Button>
          <GroupFilters status={status} type={type} sort={sort} />
        </View>
      </View>
      <Typography className="text-sm text-ink">
        {getGroupsSubtitle({ status, sort, type })}
      </Typography>
    </View>
  );
}
