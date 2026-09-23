import { cn, InputGroup, TextField, Typography } from "heroui-native";

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
      <InputGroup
        className={cn(
          "h-14 rounded-2xl border bg-panel shadow-none",
          errorMessage ? "border-danger" : "border-transparent",
        )}
      >
        <InputGroup.Prefix isDecorative className="pl-4 pr-1">
          <Typography className="text-sm text-ink">{label}</Typography>
        </InputGroup.Prefix>
        <InputGroup.Input
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
          className="h-14 rounded-2xl border-0 bg-transparent text-sm text-ink android:border-0 android:shadow-none"
        />
      </InputGroup>
      {errorMessage ? (
        <Typography className="px-1 text-xs text-danger" accessibilityLiveRegion="polite">
          {errorMessage}
        </Typography>
      ) : null}
    </TextField>
  );
}
