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
          "bg-panel h-14 px-4 flex-row items-center gap-1 rounded-2xl border shadow-none",
          errorMessage ? "border-danger" : "border-transparent",
        )}
      >
        <Typography className="text-sm text-ink">{label}</Typography>
        <TextInput
          value={value}
          onBlur={onBlur}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#8A8A8E"
          accessibilityLabel={label}
          accessibilityHint={errorMessage}
          aria-invalid={Boolean(errorMessage)}
          returnKeyType="none"
          className="flex-1 text-sm text-ink"
        />
      </View>
      {errorMessage ? (
        <Typography className="px-1 text-xs text-danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Typography>
      ) : null}
    </View>
  );
}
