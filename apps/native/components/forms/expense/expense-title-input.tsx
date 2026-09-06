import { Typography } from "heroui-native";
import { TextInput, View } from "react-native";

type ExpenseTitleInputProps = {
  value: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export function ExpenseTitleInput({
  value,
  onBlur,
  onChange,
  label = "Title",
  placeholder = "Expense Title",
}: ExpenseTitleInputProps) {
  return (
    <View className="bg-surface px-4 py-2 flex-row items-center gap-1 shadow-lg rounded-xl">
      <Typography className="text-sm">{label}</Typography>
      <TextInput
        value={value}
        onBlur={onBlur}
        onChangeText={onChange}
        placeholder={placeholder}
        returnKeyType="none"
        className="flex-1 text-sm"
      />
    </View>
  );
}
