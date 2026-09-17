import { View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Button, Typography } from "heroui-native";
import { SlidersVertical } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/icon";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;
const typeOptions = [
  { value: "all", label: "All" },
  { value: "owner", label: "Owner" },
  { value: "member", label: "Member" },
] as const;
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;
export type GroupType = (typeof typeOptions)[number]["value"];
export type GroupSort = (typeof sortOptions)[number]["value"];
export type GroupStatus = (typeof statusOptions)[number]["value"];

export function GroupFilters({
  status,
  type,
  sort,
}: {
  status: GroupStatus;
  type: GroupType;
  sort: GroupSort;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<GroupStatus>(status);
  const [draftType, setDraftType] = useState<GroupType>(type);
  const [draftSort, setDraftSort] = useState<GroupSort>(sort);

  function openFilters() {
    setDraftStatus(status);
    setDraftType(type);
    setDraftSort(sort);
    setIsFiltersOpen(true);
  }

  return (
    <BottomSheet isOpen={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <Button
        isIconOnly
        className="size-12 rounded-full bg-contrast-gradient"
        accessibilityLabel="Open group filters"
        onPress={openFilters}
      >
        <Icon icon={SlidersVertical} size={22} colorClassName="accent-on-ink" />
      </Button>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          detached
          bottomInset={insets.bottom + 12}
          className="mx-4"
          backgroundClassName="rounded-[32px]"
          contentContainerClassName="gap-4 p-4"
          handleComponent={null}
        >
          <View className="flex-row items-center justify-between">
            <BottomSheet.Title className="text-2xl font-semibold">Filters</BottomSheet.Title>
            <BottomSheet.Close accessibilityLabel="Close filters" />
          </View>
          <Typography className="text-sm">Status</Typography>
          <View className="flex-row flex-wrap items-center gap-4">
            {statusOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                className="rounded-full"
                variant={draftStatus === option.value ? "primary" : "secondary"}
                accessibilityRole="radio"
                accessibilityState={{ checked: draftStatus === option.value }}
                onPress={() => setDraftStatus(option.value)}
              >
                <Button.Label>{option.label}</Button.Label>
              </Button>
            ))}
          </View>
          <Typography className="text-sm">Type</Typography>
          <View className="flex-row flex-wrap items-center gap-4">
            {typeOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                className="rounded-full"
                variant={draftType === option.value ? "primary" : "secondary"}
                accessibilityRole="radio"
                accessibilityState={{ checked: draftType === option.value }}
                onPress={() => setDraftType(option.value)}
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
            className="w-full bg-contrast-gradient"
            onPress={() => {
              router.setParams({ status: draftStatus, type: draftType, sort: draftSort });
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
