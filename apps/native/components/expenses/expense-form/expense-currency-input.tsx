import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";
import { cn, Typography } from "heroui-native";

import { formatCurrency } from "@/utils";
import { parseExpenseAmount } from "@/utils/expenses/expense-form";

function editableAmount(value: number) {
  const whole = Math.floor(value / 100);
  const fraction = String(value % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}

type CurrencyInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  onBlur?: () => void;
  errorMessage?: string;
};

export function CurrencyInput({ value, onValueChange, onBlur, errorMessage }: CurrencyInputProps) {
  const [draft, setDraft] = useState(() => formatCurrency(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) setDraft(formatCurrency(value));
  }, [isFocused, value]);

  return (
    <View>
      <View className="h-24 flex-row items-center rounded-2xl bg-panel px-4">
        <TextInput
          accessibilityLabel="Expense amount"
          accessibilityHint={errorMessage}
          aria-invalid={Boolean(errorMessage)}
          className={cn(
            "h-24 min-w-0 flex-1 text-center text-2xl font-semibold tabular-nums android:shadow-none",
            errorMessage ? "text-danger" : value === 0 && !isFocused ? "text-muted" : "text-ink",
          )}
          inputMode="decimal"
          keyboardType="decimal-pad"
          onBlur={() => {
            setIsFocused(false);
            setDraft(formatCurrency(value));
            onBlur?.();
          }}
          onChangeText={(text) => {
            const amount = parseExpenseAmount(text);
            if (amount === undefined) return;
            setDraft(text);
            onValueChange(amount);
          }}
          onFocus={() => {
            setIsFocused(true);
            setDraft(value === 0 ? "" : editableAmount(value));
          }}
          placeholder="₱0.00"
          returnKeyType="done"
          selectTextOnFocus
          underlineColorAndroid="transparent"
          value={draft}
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
