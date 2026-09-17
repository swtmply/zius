import { Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";

import { formatCurrency } from "@/utils";

import type { SplitMethod } from "@/utils/expenses/expense-form";

type ParticipantSplitInputProps = {
  participantName: string;
  splitMethod: SplitMethod;
  value: number;
  onValueChange: (value: number) => void;
};

function formatSplitValue(splitMethod: SplitMethod, value: number) {
  return splitMethod === "percentage" ? String(Number(value.toFixed(2))) : (value / 100).toFixed(2);
}

function SplitValue({
  splitMethod,
  value,
}: Pick<ParticipantSplitInputProps, "splitMethod" | "value">) {
  return (
    <Typography
      selectable
      className="shrink-0 text-right text-xs font-semibold text-ink"
      style={{ fontVariant: ["tabular-nums"] }}
    >
      {splitMethod === "percentage"
        ? String(Number(value.toFixed(2)))
        : formatCurrency(value).replace("₱", "")}
    </Typography>
  );
}

export function ParticipantSplitInput({
  participantName,
  splitMethod,
  value,
  onValueChange,
}: ParticipantSplitInputProps) {
  const [draft, setDraft] = useState(() => formatSplitValue(splitMethod, value));
  const [isFocused, setIsFocused] = useState(false);
  const isEditable = splitMethod !== "equal" && splitMethod !== "items";

  useEffect(() => {
    if (!isFocused) {
      setDraft(formatSplitValue(splitMethod, value));
    }
  }, [isFocused, splitMethod, value]);

  if (!isEditable) {
    return (
      <View className="shrink-0 flex-row items-center justify-end gap-1">
        <SplitValue splitMethod={splitMethod} value={value} />
        <Typography className="text-[10px] font-semibold text-supporting">PHP</Typography>
      </View>
    );
  }

  const handleChangeText = (text: string) => {
    const sanitizedValue = text.replace(",", ".").replace(/[^\d.]/g, "");
    setDraft(sanitizedValue);

    const numericValue = sanitizedValue === "" ? 0 : Number(sanitizedValue);

    if (!Number.isFinite(numericValue)) {
      return;
    }

    onValueChange(
      splitMethod === "percentage"
        ? Math.min(numericValue, 100)
        : Math.min(Math.round(numericValue * 100), Number.MAX_SAFE_INTEGER),
    );
  };

  return (
    <View className="flex-row items-center gap-1">
      <TextInput
        accessibilityLabel={`${splitMethod} split for ${participantName}`}
        className="h-7 rounded-md border border-border bg-page px-2 py-0 text-right text-xs font-semibold text-ink"
        inputMode="decimal"
        keyboardType="decimal-pad"
        onBlur={() => {
          setIsFocused(false);
          setDraft(formatSplitValue(splitMethod, value));
        }}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        selectTextOnFocus
        value={draft}
      />
      <Typography className="text-[10px] font-semibold text-supporting">
        {splitMethod === "percentage" ? "%" : "PHP"}
      </Typography>
    </View>
  );
}
