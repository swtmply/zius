import { SlidersVertical } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Button, Typography } from "heroui-native";
import { View } from "react-native";

import { Icon } from "@/components/icon";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "settled", label: "Settled" },
  { value: "cancelled", label: "Cancelled" },
] as const;
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;

export type ExpenseStatus = (typeof statusOptions)[number]["value"];
export type ExpenseSort = (typeof sortOptions)[number]["value"];

export function ExpenseFilters({ status, sort }: { status: ExpenseStatus; sort: ExpenseSort }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ExpenseStatus>(status);
  const [draftSort, setDraftSort] = useState<ExpenseSort>(sort);

  function openFilters() {
    setDraftStatus(status);
    setDraftSort(sort);
    setIsFiltersOpen(true);
  }

  return (
    <BottomSheet isOpen={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
      <Button
        isIconOnly
        className="size-12 rounded-full bg-contrast-gradient"
        accessibilityLabel="Open expense filters"
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
              router.setParams({ status: draftStatus, sort: draftSort });
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
