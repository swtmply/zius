import { Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";

import type { SplitMethod } from "./transaction-form-model";

type ParticipantSplitInputProps = {
  participantName: string;
  splitMethod: SplitMethod;
  value: number;
  onValueChange: (value: number) => void;
};

function formatSplitValue(splitMethod: SplitMethod, value: number) {
  return splitMethod === "percentage" ? String(Number(value.toFixed(2))) : (value / 100).toFixed(2);
}

export function ParticipantSplitInput({
  participantName,
  splitMethod,
  value,
  onValueChange,
}: ParticipantSplitInputProps) {
  const [draft, setDraft] = useState(() => formatSplitValue(splitMethod, value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(formatSplitValue(splitMethod, value));
    }
  }, [isFocused, splitMethod, value]);

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
        className={`border border-border rounded-lg px-2 py-1 text-right w-24 ${splitMethod !== "percentage" ? "font-semibold" : ""}`}
        editable={splitMethod !== "equal"}
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
      <Typography
        className={`text-xs text-muted ${splitMethod !== "percentage" ? "font-semibold" : ""}`}
      >
        {splitMethod === "percentage" ? "%" : "PHP"}
      </Typography>
    </View>
  );
}
