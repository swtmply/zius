import { Typography } from "heroui-native";
import { TextInput, View } from "react-native";

type TransactionTitleInputProps = {
  value: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  label?: string;
  placeholder?: string;
};

export function TransactionTitleInput({
  value,
  onBlur,
  onChange,
  onSubmit,
  label = "Title",
  placeholder = "Transaction Title",
}: TransactionTitleInputProps) {
  return (
    <View className="bg-surface px-4 py-2 flex-row items-center gap-1 shadow-lg rounded-xl">
      <Typography className="text-sm">{label}</Typography>
      <TextInput
        value={value}
        onBlur={onBlur}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        returnKeyType="done"
        className="flex-1 text-sm"
      />
    </View>
  );
}
