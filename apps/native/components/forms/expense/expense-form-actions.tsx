import { categoryOptions } from "@/utils/expense-categories";
import { SaleTag01Icon, Split, UserGroup03Icon } from "@hugeicons/core-free-icons";
import { PressableFeedback } from "heroui-native";
import { useState } from "react";
import { View } from "react-native";
import { GroupPickerSelect } from "../group/group-picker-dialog";
import { splitMethods, type FormParticipant, type SplitMethod } from "./expense-form-model";
import { ExpenseSelectionSheet, type ExpenseSelectionOption } from "./expense-selection-sheet";
import { ExpenseActionTileContent } from "./expense-action-tile-content";

function splitMethodLabel(method: SplitMethod) {
  switch (method) {
    case "equal":
      return "Equal";
    case "fixed":
      return "Exact";
    case "percentage":
      return "Percentage";
    case "items":
      return "Items";
  }
}

const splitMethodOptions: readonly ExpenseSelectionOption[] = splitMethods.map((method) => ({
  value: method,
  label: splitMethodLabel(method),
}));

export type ExpenseCategory = (typeof categoryOptions)[number]["value"];

type ExpenseFormActionsProps = {
  participants: FormParticipant[];
  payer: string;
  splitMethod: SplitMethod;
  groupId?: string;
  groupName?: string;
  categoryResetKey: number;
  isDisabled?: boolean;
  onPayerChange: (email: string) => void;
  onSplitMethodChange: (method: SplitMethod) => void;
  onGroupChange: (groupId: string | undefined) => void;
  onCategoryChange: (category: ExpenseCategory | undefined) => void;
};

function CategorySelection({
  isDisabled,
  onCategoryChange,
}: Pick<ExpenseFormActionsProps, "isDisabled" | "onCategoryChange">) {
  const [category, setCategory] = useState<ExpenseCategory>();
  const selectedCategory = categoryOptions.find((option) => option.value === category);

  return (
    <ExpenseSelectionSheet
      title="Categories"
      value={category ?? "__none__"}
      options={categoryOptions}
      triggerLabel={selectedCategory?.label ?? "Category"}
      triggerIcon={SaleTag01Icon}
      triggerLabelClassName="max-w-[80px] text-center text-xs text-ink"
      adjustTriggerLabelSize={false}
      accessibilityLabel="Choose category"
      isDisabled={isDisabled}
      onSubmit={(value) => {
        const selected = categoryOptions.find((option) => option.value === value);
        const nextCategory = selected?.value;
        setCategory(nextCategory);
        onCategoryChange(nextCategory);
      }}
    />
  );
}

function PayerSelection({
  participants,
  payer,
  isDisabled,
  onPayerChange,
}: Pick<ExpenseFormActionsProps, "participants" | "payer" | "isDisabled" | "onPayerChange">) {
  const payerParticipant = participants.find(
    (participant) => participant.email.toLowerCase() === payer.toLowerCase(),
  );
  const participantOptions: readonly ExpenseSelectionOption[] = participants.map((participant) => ({
    value: participant.email,
    label: participant.name,
    participant: {
      name: participant.name,
      image: participant.image,
    },
  }));

  return (
    <ExpenseSelectionSheet
      title="Participants"
      value={payer}
      options={participantOptions}
      triggerLabel={payerParticipant?.name ?? "Payer"}
      triggerParticipant={payerParticipant}
      accessibilityLabel="Select who paid"
      isDisabled={isDisabled || participants.length === 0}
      onSubmit={onPayerChange}
    />
  );
}

function SplitSelection({
  splitMethod,
  isDisabled,
  onSplitMethodChange,
}: Pick<ExpenseFormActionsProps, "splitMethod" | "isDisabled" | "onSplitMethodChange">) {
  return (
    <ExpenseSelectionSheet
      title="Split Method"
      value={splitMethod}
      options={splitMethodOptions}
      triggerLabel={splitMethodLabel(splitMethod)}
      triggerIcon={Split}
      accessibilityLabel="Choose split method"
      isDisabled={isDisabled}
      onSubmit={(method) => {
        const selectedMethod = splitMethods.find((candidate) => candidate === method);
        if (selectedMethod) onSplitMethodChange(selectedMethod);
      }}
    />
  );
}

function GroupSelection({
  groupId,
  groupName,
  isDisabled,
  onGroupChange,
}: Pick<ExpenseFormActionsProps, "groupId" | "groupName" | "isDisabled" | "onGroupChange">) {
  return (
    <View className="flex-1">
      <GroupPickerSelect
        value={groupId}
        valueLabel={groupName}
        emptyOptionLabel="No Group"
        isDisabled={isDisabled}
        onSubmit={onGroupChange}
        renderTrigger={(label) => (
          <PressableFeedback
            accessibilityLabel="Select group"
            accessibilityRole="button"
            className={`flex-1 items-center gap-1 rounded-xl px-1 py-1${
              isDisabled ? " opacity-50" : ""
            }`}
            isDisabled={isDisabled}
          >
            <ExpenseActionTileContent icon={UserGroup03Icon} label={label} />
          </PressableFeedback>
        )}
      />
    </View>
  );
}

export function ExpenseFormActions({
  participants,
  payer,
  splitMethod,
  groupId,
  groupName,
  categoryResetKey,
  isDisabled = false,
  onPayerChange,
  onSplitMethodChange,
  onGroupChange,
  onCategoryChange,
}: ExpenseFormActionsProps) {
  return (
    <View className="rounded-2xl bg-panel p-4">
      <View className="flex-row items-center gap-1">
        <PayerSelection
          participants={participants}
          payer={payer}
          isDisabled={isDisabled}
          onPayerChange={onPayerChange}
        />
        <SplitSelection
          splitMethod={splitMethod}
          isDisabled={isDisabled}
          onSplitMethodChange={onSplitMethodChange}
        />
        <GroupSelection
          groupId={groupId}
          groupName={groupName}
          isDisabled={isDisabled}
          onGroupChange={onGroupChange}
        />
        <CategorySelection
          key={categoryResetKey}
          isDisabled={isDisabled}
          onCategoryChange={onCategoryChange}
        />
      </View>
    </View>
  );
}
