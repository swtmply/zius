import { View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheet, Button, Typography } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { SlidersVertical } from "@hugeicons/core-free-icons";

const typeOptions = [
  { value: "all", label: "All" },
  { value: "owner", label: "Owner" },
  { value: "member", label: "Member" },
] as const;
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
] as const;
type GroupType = (typeof typeOptions)[number]["value"];
type GroupSort = (typeof sortOptions)[number]["value"];

export function GroupFilters({ type, sort }: { type: GroupType; sort: GroupSort }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [draftType, setDraftType] = useState<GroupType>(type);
  const [draftSort, setDraftSort] = useState<GroupSort>(sort);

  function openFilters() {
    setDraftType(type);
    setDraftSort(sort);
    setIsFiltersOpen(true);
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
          bottomInset={insets.bottom + 12}
          className="mx-4"
          backgroundClassName="rounded-[32px]"
          contentContainerClassName="gap-4 p-5"
          handleComponent={null}
        >
          <View className="flex-row items-center justify-between">
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
