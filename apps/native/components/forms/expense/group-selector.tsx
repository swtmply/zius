import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Typography } from "heroui-native";
import { FlatList, View } from "react-native";

import { trpc } from "@/utils/trpc";

type GroupSelectorProps = {
  value: string | undefined;
  onChange: (groupId: string | undefined) => void;
  isDisabled?: boolean;
};

export function GroupSelector({ value, onChange, isDisabled = false }: GroupSelectorProps) {
  const query = useInfiniteQuery(
    trpc.group.list.infiniteQueryOptions(
      { limit: 50 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );
  const groups = query.data?.pages.flatMap((page) => page.items) ?? [];
  const options = [{ id: undefined, name: "No group" }, ...groups];

  return (
    <FlatList
      horizontal
      keyboardShouldPersistTaps="handled"
      data={options}
      keyExtractor={(item) => item.id ?? "no-group"}
      contentContainerClassName="gap-1 items-center"
      showsHorizontalScrollIndicator={false}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetching && !query.isFetchNextPageError) {
          void query.fetchNextPage();
        }
      }}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        query.isPending ? (
          <View className="items-center justify-center pr-2">
            <Typography className="text-xs text-muted">Loading groups…</Typography>
          </View>
        ) : query.isError && !query.data ? (
          <View className="flex-row items-center gap-1 pr-2">
            <Typography className="text-xs text-muted">Unable to load groups.</Typography>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={isDisabled}
              onPress={() => void query.refetch()}
            >
              <Button.Label>Try again</Button.Label>
            </Button>
          </View>
        ) : groups.length === 0 ? (
          <View className="items-center justify-center pr-2">
            <Typography className="text-xs text-muted">No groups available.</Typography>
          </View>
        ) : null
      }
      ListFooterComponent={
        query.isFetchNextPageError ? (
          <View className="flex-row items-center gap-1 pl-2">
            <Typography className="text-xs text-muted">Unable to load more.</Typography>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={isDisabled}
              onPress={() => void query.fetchNextPage()}
            >
              <Button.Label>Try again</Button.Label>
            </Button>
          </View>
        ) : query.isFetchingNextPage ? (
          <View className="items-center justify-center pl-2">
            <Typography className="text-xs text-muted">Loading more…</Typography>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const isSelected = item.id === value;

        return (
          <Button
            size="sm"
            className="rounded-full"
            variant={isSelected ? "primary" : "secondary"}
            isDisabled={isDisabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(item.id)}
          >
            <Button.Label>{item.name}</Button.Label>
          </Button>
        );
      }}
    />
  );
}
