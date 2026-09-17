import { Check, ChevronLeft } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { Icon } from "@/components/icon";

type GroupFormHeaderProps = {
  isDisabled: boolean;
  onSubmit: () => void;
};

export function GroupFormHeader({ isDisabled, onSubmit }: GroupFormHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between py-4">
      <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={() => router.back()}>
        <Icon icon={ChevronLeft} size={24} colorClassName="accent-ink" />
      </Button>
      <Typography className="text-2xl font-semibold text-ink">Create Group</Typography>
      <Button
        isIconOnly
        variant="ghost"
        accessibilityLabel="Create group"
        isDisabled={isDisabled}
        onPress={onSubmit}
      >
        <Icon icon={Check} size={24} colorClassName="accent-ink" />
      </Button>
    </View>
  );
}
