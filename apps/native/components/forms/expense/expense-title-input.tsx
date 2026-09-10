import { cn, Typography } from "heroui-native";
import { TextInput, View } from "react-native";

type ExpenseTitleInputProps = {
  value: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  errorMessage?: string;
};

export function ExpenseTitleInput({
  value,
  onBlur,
  onChange,
  label = "Title",
  placeholder = "Expense Title",
  errorMessage,
}: ExpenseTitleInputProps) {
  return (
    <View className="gap-1">
      <View
        className={cn(
          "bg-surface px-4 py-2 flex-row items-center gap-1 shadow-lg rounded-xl border",
          errorMessage ? "border-danger" : "border-transparent",
        )}
      >
        <Typography className="text-sm">{label}</Typography>
        <TextInput
          value={value}
          onBlur={onBlur}
          onChangeText={onChange}
          placeholder={placeholder}
          accessibilityLabel={label}
          accessibilityHint={errorMessage}
          aria-invalid={Boolean(errorMessage)}
          returnKeyType="none"
          className="flex-1 text-sm"
        />
      </View>
      {errorMessage ? (
        <Typography
          className="px-1 text-xs text-danger"
          accessibilityLiveRegion="polite"
        >
          {errorMessage}
        </Typography>
      ) : null}
    </View>
  );
}
