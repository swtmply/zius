import { Check, ChevronLeft } from "@hugeicons/core-free-icons";
import { useRouter } from "@/utils/navigation";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { Icon } from "@/components/icon";

type ExpenseFormHeaderProps = {
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function ExpenseFormHeader({ isSubmitting, onSubmit }: ExpenseFormHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row justify-between items-center py-4">
      <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={() => router.back()}>
        <Icon icon={ChevronLeft} size={24} colorClassName="accent-ink" />
      </Button>
      <Typography className="text-2xl font-semibold text-ink">Create Expense</Typography>
      <Button
        isIconOnly
        variant="ghost"
        accessibilityLabel="Create expense"
        isDisabled={isSubmitting}
        onPress={onSubmit}
      >
        <Icon icon={Check} size={24} colorClassName="accent-ink" />
      </Button>
    </View>
  );
}
