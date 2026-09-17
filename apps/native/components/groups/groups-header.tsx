import { Add, ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";
import { useRouter } from "@/utils/navigation";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { Icon } from "@/components/icon";
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
          <Icon icon={ChevronLeftFreeIcons} size={24} colorClassName="accent-ink" />
        </Button>
        <Typography className="flex-1 text-2xl font-semibold text-ink">Groups</Typography>
        <View className="flex-row items-center gap-2">
          <Button
            isIconOnly
            variant="ghost"
            accessibilityLabel="Create group"
            onPress={() => router.push("/groups/create")}
          >
            <Icon icon={Add} size={24} colorClassName="accent-ink" />
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
