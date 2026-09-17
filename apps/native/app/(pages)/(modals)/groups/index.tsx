import { GroupCard } from "@/components/groups/group-card";
import {
  type GroupSort,
  type GroupStatus,
  type GroupType,
} from "@/components/groups/group-filters";
import { GroupsHeader } from "@/components/groups/groups-header";
import { GroupsLoading } from "@/components/groups/skeletons/groups-skeleton";
import { GroupsEmptyState, GroupsQueryFooter } from "@/components/groups/groups-list-state";
import { FlatList, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useRouter } from "@/utils/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";

import { trpc } from "@/utils/trpc";

export default function GroupsPage() {
  const params = useLocalSearchParams<{ sort?: string; type?: string; status?: string }>();
  const router = useRouter();
  const type: GroupType = params.type === "owner" || params.type === "member" ? params.type : "all";
  const sort: GroupSort = params.sort === "oldest" || params.sort === "asc" ? "oldest" : "newest";
  const status: GroupStatus =
    params.status === "archived" || params.status === "all" ? params.status : "active";
  const query = useInfiniteQuery(
    trpc.group.list.infiniteQueryOptions(
      { type: type === "all" ? undefined : type, sort, status },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const groups = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View className="bg-page flex-1">
      <FlatList
        contentInsetAdjustmentBehavior="automatic"
        ListHeaderComponent={<GroupsHeader status={status} type={type} sort={sort} />}
        contentContainerClassName="gap-3 px-4 pb-safe-offset-8"
        data={groups}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={<View className="h-1" />}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) {
            void query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        refreshing={query.isRefetching && !query.isFetchingNextPage}
        onRefresh={() => {
          void query.refetch();
        }}
        ListEmptyComponent={
          query.isPending ? <GroupsLoading /> : !query.isError ? <GroupsEmptyState /> : null
        }
        ListFooterComponent={
          <GroupsQueryFooter
            hasGroups={groups.length > 0}
            hasNextPage={query.hasNextPage}
            isError={query.isError}
            isFetchNextPageError={query.isFetchNextPageError}
            isFetchingNextPage={query.isFetchingNextPage}
            onRetry={() => {
              if (query.isFetchNextPageError) void query.fetchNextPage();
              else void query.refetch();
            }}
          />
        }
        renderItem={({ item }) => (
          <GroupCard
            group={item}
            onPress={() =>
              router.push({
                pathname: "/groups/[groupId]",
                params: { groupId: item.id },
              })
            }
          />
        )}
      />
    </View>
  );
}
