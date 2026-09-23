import { cn, Input, TextField, Typography } from "heroui-native";
import { View } from "react-native";

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
    <TextField isInvalid={Boolean(errorMessage)} className="gap-1">
      <View
        className={cn(
          "h-14 w-full flex-row items-center gap-3 rounded-2xl border bg-panel px-4 shadow-none",
          errorMessage ? "border-danger" : "border-transparent",
        )}
      >
        <Typography className="shrink-0 text-sm text-supporting">{label}</Typography>
        <Input
          value={value}
          onBlur={onBlur}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderColorClassName="accent-muted"
          accessibilityLabel={label}
          accessibilityHint={errorMessage}
          aria-invalid={Boolean(errorMessage)}
          returnKeyType="none"
          background={null}
          textAlignVertical="center"
          style={{ includeFontPadding: false }}
          className="h-full min-w-0 flex-1 rounded-2xl border-0 bg-transparent px-0 py-0 text-sm text-ink android:border-0 android:shadow-none"
        />
      </View>
      {errorMessage ? (
        <Typography className="px-1 text-xs text-danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Typography>
      ) : null}
    </TextField>
  );
}
