import { Check, ChevronLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

type GroupFormHeaderProps = {
  isDisabled: boolean;
  onSubmit: () => void;
};

export function GroupFormHeader({ isDisabled, onSubmit }: GroupFormHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between py-4">
      <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={() => router.back()}>
        <HugeiconsIcon icon={ChevronLeft} size={24} />
      </Button>
      <Typography className="text-2xl font-semibold">Create Group</Typography>
      <Button
        isIconOnly
        variant="ghost"
        accessibilityLabel="Create group"
        isDisabled={isDisabled}
        onPress={onSubmit}
      >
        <HugeiconsIcon icon={Check} size={24} />
      </Button>
    </View>
  );
}
