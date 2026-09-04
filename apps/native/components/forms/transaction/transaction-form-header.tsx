import { Check, ChevronLeft } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useRouter } from "expo-router";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

type TransactionFormHeaderProps = {
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function TransactionFormHeader({ isSubmitting, onSubmit }: TransactionFormHeaderProps) {
  const router = useRouter();

  return (
    <View className="flex-row justify-between items-center py-4">
      <Button isIconOnly variant="ghost" onPress={() => router.back()}>
        <HugeiconsIcon icon={ChevronLeft} size={24} />
      </Button>
      <Typography className="text-2xl font-semibold">Create Transaction</Typography>
      <Button isIconOnly variant="ghost" isDisabled={isSubmitting} onPress={onSubmit}>
        <HugeiconsIcon icon={Check} size={24} />
      </Button>
    </View>
  );
}
