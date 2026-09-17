import { X } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Avatar, Button, PressableFeedback, Typography } from "heroui-native";
import { useEffect, useState } from "react";
import { TextInput, View } from "react-native";

import { ExpenseSelectionSheet } from "./expense-selection-sheet";
import { getExpenseItemErrors, type ExpenseItem, type FormParticipant } from "@/utils/expenses/expense-form";

type ExpenseItemListProps = {
  items: ExpenseItem[];
  participants: FormParticipant[];
  isDisabled?: boolean;
  showErrors?: boolean;
  onChange: (index: number, item: ExpenseItem) => void;
  onRemove: (index: number) => void;
};

type ExpenseItemRowProps = {
  item: ExpenseItem;
  participants: FormParticipant[];
  isDisabled: boolean;
  showErrors: boolean;
  isLast: boolean;
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
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : UNSAFE_NUMBER;
}

function parsePriceMinor(text: string) {
  if (!text.trim()) {
    return 0;
  }

  const normalized = text.trim().replace(",", ".");

  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized) && !/^\.\d{1,2}$/.test(normalized)) {
    return UNSAFE_NUMBER;
  }

  const [whole = "0", fraction = ""] = normalized.split(".");
  const minor = BigInt(`${whole || "0"}${fraction.padEnd(2, "0")}`);

  return minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : UNSAFE_NUMBER;
}

function formatPriceDraft(priceMinor: number) {
  if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) {
    return "";
  }

  return String(priceMinor / 100);
}

function formatPriceDisplay(priceMinor: number) {
  return Number.isSafeInteger(priceMinor) && priceMinor >= 0 ? (priceMinor / 100).toFixed(2) : "";
}

function ParticipantAvatar({ participant }: { participant: FormParticipant }) {
  return (
    <Avatar className="size-7 bg-page" size="sm" alt={participant.name}>
      {participant.image ? <Avatar.Image source={{ uri: participant.image }} /> : null}
      <Avatar.Fallback>
        <Typography className="text-[10px] text-ink">
          {participant.name.slice(0, 1).toUpperCase()}
        </Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}

function ExpenseItemRow({
  item,
  participants,
  isDisabled,
  showErrors,
  isLast,
  onChange,
  onRemove,
}: ExpenseItemRowProps) {
  const [quantityDraft, setQuantityDraft] = useState(String(item.quantity));
  const [priceDraft, setPriceDraft] = useState(formatPriceDraft(item.priceMinor));
  const [isQuantityFocused, setIsQuantityFocused] = useState(false);
  const [isPriceFocused, setIsPriceFocused] = useState(false);

  useEffect(() => {
    if (!isQuantityFocused && Number.isSafeInteger(item.quantity) && item.quantity >= 0) {
      setQuantityDraft(String(item.quantity));
    }
  }, [isQuantityFocused, item.quantity]);

  useEffect(() => {
    if (!isPriceFocused && Number.isSafeInteger(item.priceMinor) && item.priceMinor >= 0) {
      setPriceDraft(formatPriceDraft(item.priceMinor));
    }
  }, [isPriceFocused, item.priceMinor]);

  const errors = getExpenseItemErrors(item);
  const errorMessages = Object.values(errors).filter((error): error is string => Boolean(error));
  const assignedParticipant = participants.find(
    (participant) => participant.email.toLowerCase() === item.participantEmail?.toLowerCase(),
  );
  return (
    <View className={`gap-2 py-2${isLast ? "" : " border-b border-dashed border-border"}`}>
      <View className="flex-row items-center gap-1">
        <TextInput
          accessibilityLabel={`Quantity for ${item.name || "item"}`}
          className={`h-8 w-7 rounded-lg border bg-page px-1 py-0 text-center text-xs text-ink ${
            showErrors && errors.quantity ? "border-danger" : "border-border"
          }`}
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
          accessibilityLabel={`Name for ${item.name || "item"}`}
          className={`h-8 min-w-0 flex-1 rounded-lg border bg-page px-2 py-0 text-xs text-ink ${
            showErrors && errors.name ? "border-danger" : "border-border"
          }`}
          editable={!isDisabled}
          onChangeText={(name) => onChange({ ...item, name })}
          placeholder="Item name"
          placeholderTextColor="#8A8A8E"
          returnKeyType="next"
          value={item.name}
        />
        <TextInput
          accessibilityLabel={`Price for ${item.name || "item"}`}
          className={`h-8 w-16 rounded-lg border bg-page px-2 py-0 text-right text-xs font-semibold text-ink ${
            showErrors && errors.priceMinor ? "border-danger" : "border-border"
          }`}
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
          value={isPriceFocused ? priceDraft : formatPriceDisplay(item.priceMinor)}
        />
        <Typography className="text-[10px] font-semibold text-supporting">PHP</Typography>
        <Button
          accessibilityLabel={`Remove ${item.name || "item"}`}
          isDisabled={isDisabled}
          isIconOnly
          className="size-7 rounded-full"
          variant="ghost"
          onPress={onRemove}
        >
          <HugeiconsIcon icon={X} color="#8A8A8E" size={16} />
        </Button>
      </View>

      <ExpenseSelectionSheet
        title="Assign Participant"
        value={assignedParticipant?.id ?? NONE_OPTION}
        options={[
          { value: NONE_OPTION, label: "Unassigned" },
          ...participants.map((participant) => ({
            value: participant.id,
            label: participant.name,
            participant: { name: participant.name, image: participant.image },
          })),
        ]}
        triggerLabel={assignedParticipant?.name ?? "Unassigned"}
        accessibilityLabel={`Assign ${item.name || "item"} to a participant`}
        isDisabled={isDisabled}
        renderTrigger={(label) => (
          <PressableFeedback
            accessibilityLabel={`Assign ${item.name || "item"} to a participant`}
            accessibilityRole="button"
            className={`self-start flex-row items-center gap-2 rounded-full bg-page px-2 py-1${
              isDisabled ? " opacity-50" : ""
            }`}
            isDisabled={isDisabled}
          >
            {assignedParticipant ? <ParticipantAvatar participant={assignedParticipant} /> : null}
            <Typography className="text-xs text-ink">{label}</Typography>
          </PressableFeedback>
        )}
        onSubmit={(participantId) => {
          const participant =
            participantId !== NONE_OPTION
              ? participants.find((candidate) => candidate.id === participantId)
              : undefined;

          onChange({
            ...item,
            participantEmail: participant?.email.toLowerCase(),
          });
        }}
      />

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
}: ExpenseItemListProps) {
  return (
    <View className="rounded-2xl bg-panel px-4">
      {items.length === 0 ? (
        <Typography className="py-4 text-center text-xs text-supporting">
          No items yet. Add an item to split this expense by item.
        </Typography>
      ) : (
        items.map((item, index) => (
          <ExpenseItemRow
            key={item.id}
            item={item}
            participants={participants}
            isDisabled={isDisabled}
            showErrors={showErrors}
            isLast={index === items.length - 1}
            onChange={(nextItem) => onChange(index, nextItem)}
            onRemove={() => onRemove(index)}
          />
        ))
      )}
    </View>
  );
}
