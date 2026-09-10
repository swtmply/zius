import { Add, X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Button, Select, Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";

import { formatCurrency } from "@/utils";

import {
  getExpenseItemErrors,
  sumExpenseItemPrices,
  type ExpenseItem,
  type FormParticipant,
} from "./expense-form-model";

type ExpenseItemListProps = {
  items: ExpenseItem[];
  participants: FormParticipant[];
  isDisabled?: boolean;
  showErrors?: boolean;
  onChange: (index: number, item: ExpenseItem) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
};

type ExpenseItemRowProps = {
  item: ExpenseItem;
  participants: FormParticipant[];
  isDisabled: boolean;
  showErrors: boolean;
  onChange: (item: ExpenseItem) => void;
  onRemove: () => void;
};

const NONE_OPTION = "__none__";
const UNSAFE_NUMBER = Number.MAX_SAFE_INTEGER + 1;

function parseQuantity(text: string) {
  if (!text.trim()) {
    return 0;
  }

  if (!/^\d+$/.test(text.trim())) {
    return UNSAFE_NUMBER;
  }

  const value = BigInt(text.trim());
  return value <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(value)
    : UNSAFE_NUMBER;
}

function parsePriceMinor(text: string) {
  if (!text.trim()) {
    return 0;
  }

  const normalized = text.trim().replace(",", ".");

  if (
    !/^\d+(?:\.\d{0,2})?$/.test(normalized) &&
    !/^\.\d{1,2}$/.test(normalized)
  ) {
    return UNSAFE_NUMBER;
  }

  const [whole = "0", fraction = ""] = normalized.split(".");
  const minor = BigInt(`${whole || "0"}${fraction.padEnd(2, "0")}`);

  return minor <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(minor)
    : UNSAFE_NUMBER;
}

function formatPriceDraft(priceMinor: number) {
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) {
    return "";
  }

  return String(priceMinor / 100);
}

function ExpenseItemRow({
  item,
  participants,
  isDisabled,
  showErrors,
  onChange,
  onRemove,
}: ExpenseItemRowProps) {
  const [quantityDraft, setQuantityDraft] = useState(String(item.quantity));
  const [priceDraft, setPriceDraft] = useState(
    formatPriceDraft(item.priceMinor),
  );
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);
  const [isPriceFocused, setIsPriceFocused] = useState(false);

  useEffect(() => {
    if (
      !isQuantityFocused &&
      Number.isSafeInteger(item.quantity) &&
      item.quantity >= 0
    ) {
      setQuantityDraft(String(item.quantity));
    }
  }, [isQuantityFocused, item.quantity]);

  useEffect(() => {
    if (
      !isPriceFocused &&
      Number.isSafeInteger(item.priceMinor) &&
      item.priceMinor >= 0
    ) {
      setPriceDraft(formatPriceDraft(item.priceMinor));
    }
  }, [isPriceFocused, item.priceMinor]);

  const errors = getExpenseItemErrors(item);
  const errorMessages = Object.values(errors).filter((error): error is string =>
    Boolean(error),
  );
  const assignedParticipant = participants.find(
    (participant) =>
      participant.email.toLowerCase() === item.participantEmail?.toLowerCase(),
  );
  const selectedOption = assignedParticipant
    ? { value: assignedParticipant.id, label: assignedParticipant.name }
    : undefined;

  return (
    <View className="gap-1 border-b border-dashed border-border py-2">
      <View className="flex-row items-center gap-1">
        <TextInput
          accessibilityLabel={`Quantity for ${item.name || "item"}`}
          className={`w-8 border rounded-lg p-1 text-center ${showErrors && errors.quantity ? "border-danger" : "border-border"}`}
          editable={!isDisabled}
          inputMode="numeric"
          keyboardType="number-pad"
          onBlur={() => {
            setIsQuantityFocused(false);
            if (Number.isSafeInteger(item.quantity) && item.quantity >= 0) {
              setQuantityDraft(String(item.quantity));
            }
          }}
          onChangeText={(text) => {
            setQuantityDraft(text);
            onChange({ ...item, quantity: parseQuantity(text) });
          }}
          onFocus={() => setIsQuantityFocused(true)}
          selectTextOnFocus
          value={quantityDraft}
        />
        <TextInput
          accessibilityLabel="Item name"
          className={`min-w-0 flex-1 rounded-lg border px-2 py-1 ${showErrors && errors.name ? "border-danger" : "border-border"}`}
          editable={!isDisabled}
          onChangeText={(name) => onChange({ ...item, name })}
          placeholder="Item name"
          returnKeyType="next"
          value={item.name}
        />
        <Select
          isDisabled={isDisabled}
          presentation="bottom-sheet"
          value={selectedOption}
          onValueChange={(option) => {
            const participant =
              option && option.value !== NONE_OPTION
                ? participants.find(
                    (candidate) => candidate.id === option.value,
                  )
                : undefined;

            onChange({
              ...item,
              participantEmail: participant?.email.toLowerCase(),
            });
          }}
        >
          <Select.Trigger variant="unstyled" asChild>
            <Button
              className="h-8 w-24 min-w-0 rounded-full px-2"
              isDisabled={isDisabled}
              variant="secondary"
            >
              <Select.Value className="text-sm" placeholder="None" />
            </Button>
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay className="bg-black/20" />
            <Select.Content
              detached={true}
              contentContainerClassName="px-4 pb-4"
              className="mx-4 rounded-4xl overflow-hidden"
              presentation="bottom-sheet"
              enableDynamicSizing
              bottomInset={32}
            >
              <BottomSheetScrollView
                contentContainerStyle={{
                  gap: 8,
                  paddingBottom: 32,
                  paddingTop: 8,
                }}
                keyboardShouldPersistTaps="handled"
              >
                <Select.Item value={NONE_OPTION} label="None" />
                {participants.map((participant) => (
                  <Select.Item
                    key={participant.id}
                    value={participant.id}
                    label={participant.name}
                  />
                ))}
              </BottomSheetScrollView>
            </Select.Content>
          </Select.Portal>
        </Select>
        <TextInput
          accessibilityLabel={`Price for ${item.name || "item"}`}
          className={`w-20 rounded-lg border bg-surface px-2 py-1 text-right font-semibold ${showErrors && errors.priceMinor ? "border-danger" : "border-border"}`}
          editable={!isDisabled}
          inputMode="decimal"
          keyboardType="decimal-pad"
          onBlur={() => {
            setIsPriceFocused(false);
            if (Number.isSafeInteger(item.priceMinor) && item.priceMinor >= 0) {
              setPriceDraft(formatPriceDraft(item.priceMinor));
            }
          }}
          onChangeText={(text) => {
            setPriceDraft(text);
            onChange({ ...item, priceMinor: parsePriceMinor(text) });
          }}
          onFocus={() => setIsPriceFocused(true)}
          selectTextOnFocus
          value={
            isPriceFocused ||
            !Number.isSafeInteger(item.priceMinor) ||
            item.priceMinor < 0
              ? priceDraft
              : formatCurrency(item.priceMinor)
          }
        />
        <Button
          accessibilityLabel={`Remove ${item.name || "item"}`}
          isDisabled={isDisabled}
          isIconOnly
          className="size-7 rounded-full"
          variant="danger"
          onPress={onRemove}
        >
          <HugeiconsIcon icon={X} color="#ffffff" size={16} />
        </Button>
      </View>
      {showErrors && errorMessages.length > 0 ? (
        <Typography className="px-1 text-xs text-danger" selectable>
          {errorMessages.join(" · ")}
        </Typography>
      ) : null}
    </View>
  );
}

export function ExpenseItemList({
  items,
  participants,
  isDisabled = false,
  showErrors = false,
  onChange,
  onRemove,
  onAdd,
}: ExpenseItemListProps) {
  const total = sumExpenseItemPrices(items);

  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-1 border-b border-dashed border-border pb-2">
        <Typography className="w-8 px-1 text-xs text-muted">Qty.</Typography>
        <Typography className="min-w-0 flex-1 text-xs text-muted">
          Name
        </Typography>
        <Typography className="w-24 text-xs text-muted">Assigned To</Typography>
        <Typography className="w-20 text-right text-xs text-muted">
          Price
        </Typography>
        <View className="size-7" />
      </View>

      {items.map((item, index) => (
        <ExpenseItemRow
          key={item.id}
          item={item}
          participants={participants}
          isDisabled={isDisabled}
          showErrors={showErrors}
          onChange={(nextItem) => onChange(index, nextItem)}
          onRemove={() => onRemove(index)}
        />
      ))}

      <Button isDisabled={isDisabled} variant="secondary" onPress={onAdd}>
        <HugeiconsIcon icon={Add} size={16} />
        <Button.Label>Add item</Button.Label>
      </Button>
    </View>
  );
}
