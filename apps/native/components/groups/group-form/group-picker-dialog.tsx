import { Check, X } from "@hugeicons/core-free-icons";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button, Select, Skeleton, Typography } from "heroui-native";
import { useEffect, useState, type ReactNode } from "react";
import { Keyboard, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { trpc } from "@/utils/trpc";

type GroupPickerSelectProps = {
  isDisabled?: boolean;
  onSubmit: (groupId: string | undefined) => void;
  value?: string;
  valueLabel?: string;
  renderTrigger?: (label: string) => ReactNode;
  emptyOptionLabel?: string;
};

const NONE_OPTION = "__none__";
const GROUP_ITEM_HEIGHT = 48;

export function GroupPickerSelect({
  isDisabled = false,
  onSubmit,
  value,
  valueLabel,
  renderTrigger,
  emptyOptionLabel = "No group",
}: GroupPickerSelectProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(value ?? NONE_OPTION);
  const query = useInfiniteQuery(
    trpc.group.list.infiniteQueryOptions(
      { limit: 50 },
      {
        enabled: isOpen,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
    ),
  );
  const groups = query.data?.pages.flatMap((page) => page.items) ?? [];
  const visibleGroups =
    selectedGroupId !== NONE_OPTION && !groups.some((group) => group.id === selectedGroupId)
      ? [{ id: selectedGroupId, name: valueLabel ?? "Group" }, ...groups]
      : groups;
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedOption = selectedGroup
    ? { value: selectedGroup.id, label: selectedGroup.name }
    : selectedGroupId === NONE_OPTION
      ? { value: NONE_OPTION, label: emptyOptionLabel }
      : { value: selectedGroupId, label: valueLabel ?? "Group" };
  const selectedLabel =
    selectedGroup?.name ??
    (selectedGroupId === NONE_OPTION ? emptyOptionLabel : (valueLabel ?? "Group"));
  const maxSheetHeight = windowHeight * 0.7;
  const listPadding = 8;
  const listHeight = query.isPending
    ? 3 * GROUP_ITEM_HEIGHT + 2 * 12
    : query.isError
      ? 72
      : visibleGroups.length === 0
        ? GROUP_ITEM_HEIGHT
        : (visibleGroups.length + 1) * GROUP_ITEM_HEIGHT + visibleGroups.length * 4;
  const listFooterHeight = query.isFetchNextPageError ? 64 : query.isFetchingNextPage ? 24 : 0;
  const pickerHeight = Math.min(
    maxSheetHeight,
    32 + 16 + listHeight + listFooterHeight + listPadding * 2 + 16 + 40 + 32,
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setSelectedGroupId(value ?? NONE_OPTION);
    if (open) Keyboard.dismiss();
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedGroupId(value ?? NONE_OPTION);
    }
  }, [isOpen, value]);

  return (
    <View className={renderTrigger ? "flex-1" : undefined}>
      <Select
        isDisabled={isDisabled}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        onValueChange={(option) => setSelectedGroupId(option?.value ?? NONE_OPTION)}
        presentation="bottom-sheet"
        value={selectedOption}
      >
        <Select.Trigger variant="unstyled" asChild>
          {renderTrigger ? (
            renderTrigger(selectedLabel)
          ) : (
            <Button
              variant="secondary"
              className="h-8 min-h-0 w-full rounded-full bg-page px-3"
              isDisabled={isDisabled}
              accessibilityLabel="Add participants from group"
            >
              <Button.Label className="text-xs font-normal text-ink">
                Add Participants from Group
              </Button.Label>
            </Button>
          )}
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay className="bg-black/20" />
          <Select.Content
            detached
            bottomInset={insets.bottom + 12}
            className="mx-4 overflow-hidden"
            backgroundClassName="rounded-[32px]"
            contentContainerClassName="h-full gap-4 p-4"
            enableDynamicSizing={false}
            enableOverDrag={false}
            handleComponent={null}
            presentation="bottom-sheet"
            snapPoints={[pickerHeight]}
          >
            <View className="flex-row items-center justify-between gap-4">
              <Typography className="text-lg font-normal text-ink">Your Groups</Typography>
              <Button
                isIconOnly
                variant="secondary"
                className="size-8 rounded-full bg-page"
                accessibilityLabel="Close group picker"
                onPress={() => handleOpenChange(false)}
              >
                <Icon icon={X} size={16} colorClassName="accent-ink" />
              </Button>
            </View>

            <BottomSheetScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                gap: 4,
                paddingVertical: listPadding,
              }}
              showsVerticalScrollIndicator={false}
              onScroll={({ nativeEvent }) => {
                const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
                const isNearBottom =
                  layoutMeasurement.height + contentOffset.y >= contentSize.height - 48;

                if (
                  isNearBottom &&
                  query.hasNextPage &&
                  !query.isFetching &&
                  !query.isFetchNextPageError
                ) {
                  void query.fetchNextPage();
                }
              }}
            >
              {query.isPending ? (
                <View className="gap-3 py-2">
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} className="h-12 w-full rounded-xl" />
                  ))}
                </View>
              ) : query.isError ? (
                <View className="items-center gap-3 py-2">
                  <Typography className="text-xs text-supporting">
                    Unable to load your groups.
                  </Typography>
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={isDisabled}
                    onPress={() => void query.refetch()}
                  >
                    <Button.Label>Try again</Button.Label>
                  </Button>
                </View>
              ) : visibleGroups.length === 0 ? (
                <Typography className="py-2 text-sm text-ink">
                  You currently don’t belong to any groups.
                </Typography>
              ) : (
                <>
                  <Select.Item
                    value={NONE_OPTION}
                    label={emptyOptionLabel}
                    closeOnPress={false}
                    className="p-0"
                  >
                    {({ isSelected: itemIsSelected }) => (
                      <View
                        className="min-h-12 flex-1 flex-row items-center justify-between rounded-xl border-ink px-2"
                        style={{
                          borderRadius: 12,
                          borderWidth: itemIsSelected ? 1 : 0,
                        }}
                      >
                        <Select.ItemLabel className="flex-1 text-sm text-ink" />
                        {itemIsSelected ? (
                          <Icon icon={Check} size={16} colorClassName="accent-ink" />
                        ) : null}
                      </View>
                    )}
                  </Select.Item>
                  {visibleGroups.map((item) => (
                    <Select.Item
                      key={item.id}
                      value={item.id}
                      label={item.name}
                      closeOnPress={false}
                      className="p-0"
                    >
                      {({ isSelected: itemIsSelected }) => (
                        <View
                          className="min-h-12 flex-1 flex-row items-center justify-between rounded-xl border-ink px-2"
                          style={{
                            borderRadius: 12,
                            borderWidth: itemIsSelected ? 1 : 0,
                          }}
                        >
                          <Select.ItemLabel className="flex-1 text-sm text-ink" numberOfLines={1} />
                          {itemIsSelected ? (
                            <Icon icon={Check} size={16} colorClassName="accent-ink" />
                          ) : null}
                        </View>
                      )}
                    </Select.Item>
                  ))}
                </>
              )}
              {query.isFetchNextPageError ? (
                <View className="items-center gap-2 py-2">
                  <Typography className="text-xs text-supporting">
                    Unable to load more groups.
                  </Typography>
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
                <Typography className="py-2 text-center text-xs text-supporting">
                  Loading more…
                </Typography>
              ) : null}
            </BottomSheetScrollView>

            <Button
              className="w-full bg-contrast-gradient"
              isDisabled={isDisabled}
              onPress={() => {
                onSubmit(selectedGroupId === NONE_OPTION ? undefined : selectedGroupId);
                handleOpenChange(false);
              }}
            >
              <Button.Label>Submit</Button.Label>
            </Button>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
