import { GroupFilters } from "@/components/groups/group-filters";
import { GroupsLoading } from "@/components/groups/groups-loading";
import { FlatList, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Avatar, Button, Typography } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add, Cancel01Icon, ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";

import { trpc } from "@/utils/trpc";

export default function GroupsPage() {
  const params = useLocalSearchParams<{ sort?: string; type?: string }>();
  const router = useRouter();
  const type = params.type === "owner" || params.type === "member" ? params.type : "all";
  const sort = params.sort === "oldest" || params.sort === "asc" ? "oldest" : "newest";
  const query = useInfiniteQuery(
    trpc.group.list.infiniteQueryOptions(
      { type: type === "all" ? undefined : type, sort },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const groups = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View className="bg-background flex-1">
      <FlatList
        ListHeaderComponent={
          <View className="pt-safe gap-4 pb-4">
            <View className="flex-row justify-between items-center py-4">
              <Button
                isIconOnly
                variant="ghost"
                accessibilityLabel="Go back"
                onPress={() => router.back()}
              >
                <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
              </Button>
              <Typography className="text-2xl font-semibold">Groups</Typography>
              <Button
                isIconOnly
                variant="ghost"
                accessibilityLabel="Create group"
                onPress={() => router.push("/create-group")}
              >
                <HugeiconsIcon icon={Add} size={24} />
              </Button>
            </View>
            <View className="flex-row flex-wrap items-center gap-4">
              <GroupFilters type={type} sort={sort} />
              {type !== "all" && (
                <View className="flex-row items-center gap-4">
                  <Typography className="text-sm">Type:</Typography>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    accessibilityLabel="Clear type filter"
                    onPress={() => router.setParams({ type: "all" })}
                  >
                    <Button.Label>{type === "owner" ? "Owner" : "Member"}</Button.Label>
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  </Button>
                </View>
              )}
              {!!params.sort && (
                <View className="flex-row items-center gap-4">
                  <Typography className="text-sm">Sort:</Typography>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    accessibilityLabel="Reset sort to newest first"
                    onPress={() => router.setParams({ sort: undefined })}
                  >
                    <Button.Label>{sort === "newest" ? "Newest" : "Oldest"}</Button.Label>
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  </Button>
                </View>
              )}
            </View>
          </View>
        }
        contentContainerClassName="px-4 pb-safe-offset-8"
        data={groups}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={<View className="h-4" />}
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
          query.isPending ? (
            <GroupsLoading />
          ) : !query.isError ? (
            <View className="items-center gap-1 py-10">
              <Typography className="text-sm font-semibold">No groups</Typography>
              <Typography className="text-xs text-muted">No groups match these filters.</Typography>
            </View>
          ) : null
        }
        ListFooterComponent={
          query.isError ? (
            <View className="items-center gap-4 py-6">
              <Typography className="text-xs text-muted">Unable to load groups.</Typography>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  if (query.isFetchNextPageError) void query.fetchNextPage();
                  else void query.refetch();
                }}
              >
                <Button.Label>Try again</Button.Label>
              </Button>
            </View>
          ) : query.isFetchingNextPage ? (
            <View className="pt-3">
              <GroupsLoading count={2} />
            </View>
          ) : groups.length > 0 && !query.hasNextPage ? (
            <Typography className="text-center text-xs text-muted py-4">No more.</Typography>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            className="bg-surface border border-border rounded-xl p-4 gap-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.name}`}
            onPress={() =>
              router.push({
                pathname: "/groups/[groupId]",
                params: { groupId: item.id },
              })
            }
          >
            <Typography selectable className="text-sm font-semibold">
              {item.name}
            </Typography>
            <View className="flex-row flex-wrap items-center justify-start">
              {item.participants.map((participant, index) => (
                <Avatar
                  key={participant.id}
                  className={index === 0 ? undefined : "-ml-4"}
                  size="sm"
                  alt={participant.name}
                >
                  {participant.image && <Avatar.Image source={{ uri: participant.image }} />}
                  <Avatar.Fallback>
                    <Typography>{participant.name.slice(0, 1).toUpperCase()}</Typography>
                  </Avatar.Fallback>
                </Avatar>
              ))}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
