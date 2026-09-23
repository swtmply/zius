import { TextInput, View } from "react-native";
import { useRef } from "react";
import { Button, cn, Typography } from "heroui-native";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  currencyDisplay: "symbol",
});
const currencyFractionDigits = currencyFormatter.resolvedOptions().maximumFractionDigits ?? 2;
const currencyAmountFormatter = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: currencyFractionDigits,
  maximumFractionDigits: currencyFractionDigits,
});
const currencySymbol = currencyFormatter
  .formatToParts(0)
  .find((part) => part.type === "currency")?.value;

type CurrencyInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  errorMessage?: string;
};

export function CurrencyInput({ value, onValueChange, onBlur, errorMessage }: CurrencyInputProps) {
  const inputRef = useRef<TextInput>(null);
  const divisor = 10 ** currencyFractionDigits;
  const formattedValue = currencyAmountFormatter.format(Number(value) / divisor);
  const isEmpty = !value;

  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, "");

    if (!digits) {
      onValueChange("");
      return;
    }

    const minor = Number(digits);

    if (Number.isSafeInteger(minor)) {
      onValueChange(digits);
    }
  };

  return (
    <View>
      <Button
        variant="ghost"
        className="w-full h-24"
        accessibilityLabel="Expense amount"
        onPress={() => inputRef.current?.focus()}
      >
        <Typography
          className={cn(
            "text-2xl font-semibold tabular-nums",
            isEmpty ? "text-muted" : "text-ink",
            errorMessage && "text-danger",
          )}
          selectable
        >
          {currencySymbol}
          {formattedValue}
        </Typography>
      </Button>

      <View className="flex-row items-center absolute inset-x-0 top-0 h-24 justify-center opacity-0">
        <TextInput
          value={`₱${formattedValue}`}
          onChangeText={handleChangeText}
          onBlur={onBlur}
          accessibilityLabel="Expense amount"
          accessibilityHint={errorMessage}
          aria-invalid={Boolean(errorMessage)}
          ref={inputRef}
          keyboardType="number-pad"
          inputMode="numeric"
          placeholder="0.00"
          className="text-2xl font-semibold text-center flex-1"
          returnKeyType="next"
        />
      </View>
      {errorMessage ? (
        <Typography className="text-xs text-danger text-center" accessibilityLiveRegion="polite">
          {errorMessage}
        </Typography>
      ) : null}
    </View>
  );
}
