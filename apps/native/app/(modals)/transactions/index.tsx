import { FlatList, View } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Avatar,
  BottomSheet,
  Button,
  PressableFeedback,
  Separator,
  Skeleton,
  Typography,
} from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Add,
  Cancel01Icon,
  ChevronLeftFreeIcons,
  SlidersVertical,
} from "@hugeicons/core-free-icons";

import { TransactionsEmptyState } from "@/components/dashboard/transactions";
import { formatCurrency, formatDate } from "@/utils";
import { trpc } from "@/utils/trpc";

const typeOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "settled", label: "Settled" },
] as const;
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;
type TransactionType = (typeof typeOptions)[number]["value"];
type TransactionSort = (typeof sortOptions)[number]["value"];

export default function TransactionsPage() {
  const params = useLocalSearchParams<{ sort?: string; type?: string }>();
  const router = useRouter();
  const type = params.type === "active" || params.type === "settled" ? params.type : "all";
  const sort = params.sort === "oldest" || params.sort === "asc" ? "oldest" : "newest";
  const query = useInfiniteQuery(
    trpc.bill.list.infiniteQueryOptions(
      { status: type, sort },
      { getNextPageParam: (page) => page.nextCursor ?? undefined },
    ),
  );
  const transactions = query.data?.pages.flatMap((page) => page.items) ?? [];

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
              <Typography className="text-2xl font-semibold">Transactions</Typography>
              <Button
                isIconOnly
                variant="ghost"
                accessibilityLabel="Create transaction"
                onPress={() => router.push("/create-transaction")}
              >
                <HugeiconsIcon icon={Add} size={24} />
              </Button>
            </View>
            <View className="flex-row flex-wrap items-center gap-4">
              <TransactionFilters type={type} sort={sort} />
              {type !== "all" && (
                <View className="flex-row flex-wrap items-center gap-4">
                  <Typography className="text-sm">Type:</Typography>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    accessibilityLabel="Clear type filter"
                    onPress={() => router.setParams({ type: "all" })}
                  >
                    <Button.Label>{type === "active" ? "Active" : "Settled"}</Button.Label>
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                  </Button>
                </View>
              )}
              {!!params.sort && (
                <View className="flex-row flex-wrap items-center gap-4">
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
        data={transactions}
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
            <TransactionsLoading />
          ) : !query.isError ? (
            <TransactionsEmptyState
              title="No transactions"
              description="No transactions match these filters."
            />
          ) : null
        }
        ListFooterComponent={
          query.isError ? (
            <View className="items-center gap-4 py-6">
              <Typography className="text-sm text-muted">Unable to load transactions.</Typography>
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
            <View className="pt-4">
              <TransactionsLoading count={2} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <PressableFeedback
            onPress={() =>
              router.push({
                pathname: "/(modals)/transactions/[transactionId]",
                params: { transactionId: item.id },
              })
            }
          >
            <View className="bg-surface border border-border rounded-xl p-4 gap-2">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-1 gap-1">
                  <Typography className="text-sm">{item.title}</Typography>
                  <Typography className="text-xs text-muted">
                    {formatDate(new Date(item.occurredAt))}
                  </Typography>
                </View>
                <Typography className="text-sm font-semibold">
                  {formatCurrency(item.totalMinor)}
                </Typography>
              </View>
              <Separator className="border-t border-dashed border-border bg-transparent" />
              <View className="flex-row items-center">
                {item.participants.map((participant, index) => (
                  <Avatar
                    key={participant.id}
                    className={index === 0 ? undefined : "-ml-4"}
                    size="sm"
                    alt={participant.name}
                  >
                    <Avatar.Fallback>
                      <Typography className="text-sm">{participant.name[0]}</Typography>
                    </Avatar.Fallback>
                  </Avatar>
                ))}
              </View>
            </View>
          </PressableFeedback>
        )}
      />
    </View>
  );
}

function TransactionsLoading({ count = 4 }: { count?: number }) {
  return (
    <View
      className="gap-4"
      accessible
      accessibilityLabel="Loading transactions"
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View key={index} className="bg-surface border border-border rounded-xl p-4 gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1 gap-1">
              <Skeleton className="h-5 w-3/4 rounded-sm" />
              <Skeleton className="h-4 w-1/2 rounded-sm" />
            </View>
            <Skeleton className="h-5 w-20 rounded-sm" />
          </View>
          <Separator className="border-t border-dashed border-border bg-transparent" />
          <View className="flex-row items-center">
            {[0, 1, 2].map((participant, index) => (
              <Skeleton
                key={participant}
                className={index === 0 ? "size-10 rounded-full" : "size-10 rounded-full -ml-4"}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function TransactionFilters({ type, sort }: { type: TransactionType; sort: TransactionSort }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftType, setDraftType] = useState<TransactionType>(type);
  const [draftSort, setDraftSort] = useState<TransactionSort>(sort);

  function openFilters() {
    setDraftType(type);
    setDraftSort(sort);
    setIsFiltersOpen(true);
  }

  function selectType(value: TransactionType) {
    // Selecting both statuses, or clearing the only selection, means all.
    setDraftType((current) => (current === "all" ? value : "all"));
  }

  return (
    <BottomSheet isOpen={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <Button variant="secondary" size="sm" onPress={openFilters}>
        <HugeiconsIcon icon={SlidersVertical} size={24} />
        <Button.Label>Filters</Button.Label>
      </Button>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          detached
          bottomInset={insets.bottom + 16}
          className="mx-4"
          backgroundClassName="rounded-[32px]"
          contentContainerClassName="gap-4 p-4"
          handleComponent={null}
        >
          <View className="flex-row items-center justify-between gap-4">
            <BottomSheet.Title className="text-2xl font-semibold">Filters</BottomSheet.Title>
            <BottomSheet.Close accessibilityLabel="Close filters" />
          </View>
          <Typography className="text-sm">Type</Typography>
          <View className="flex-row flex-wrap items-center gap-4">
            {typeOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                className="rounded-full"
                variant={draftType === option.value ? "primary" : "secondary"}
                accessibilityState={{ selected: draftType === option.value }}
                onPress={() => selectType(option.value)}
              >
                <Button.Label>{option.label}</Button.Label>
              </Button>
            ))}
          </View>
          <Typography className="text-sm">Sort</Typography>
          <View className="flex-row flex-wrap items-center gap-4">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                className="rounded-full"
                variant={draftSort === option.value ? "primary" : "secondary"}
                accessibilityRole="radio"
                accessibilityState={{ checked: draftSort === option.value }}
                onPress={() => setDraftSort(option.value)}
              >
                <Button.Label>{option.label}</Button.Label>
              </Button>
            ))}
          </View>
          <Button
            className="w-full"
            onPress={() => {
              router.setParams({ type: draftType, sort: draftSort });
              setIsFiltersOpen(false);
            }}
          >
            <Button.Label>Submit</Button.Label>
          </Button>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
