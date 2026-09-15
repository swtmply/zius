import { categoryOptions } from "@/utils/expense-categories";
import { Check, SaleTag01Icon, Split, UserGroup03Icon, X } from "@hugeicons/core-free-icons";
import type { HugeiconsProps } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Avatar, Button, PressableFeedback, Select, Typography } from "heroui-native";
import { useState, type ReactNode } from "react";
import { Keyboard, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GroupPickerSelect } from "../group/group-picker-dialog";

import { splitMethods, type FormParticipant, type SplitMethod } from "./expense-form-model";

type ActionParticipant = {
  name: string;
  image?: string | null;
};

type ExpenseActionTileContentProps = {
  icon?: HugeiconsProps["icon"];
  label: string;
  participant?: ActionParticipant;
  labelClassName?: string;
  adjustsFontSizeToFit?: boolean;
};

function ParticipantAvatar({ participant }: { participant: ActionParticipant }) {
  return (
    <Avatar className="size-12 bg-page" size="sm" alt={participant.name}>
      {participant.image ? <Avatar.Image source={{ uri: participant.image }} /> : null}
      <Avatar.Fallback>
        <Typography className="text-sm text-ink">
          {participant.name.slice(0, 1).toUpperCase()}
        </Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}

export function ExpenseActionTileContent({
  icon,
  label,
  participant,
  labelClassName = "max-w-full text-center text-xs text-ink",
  adjustsFontSizeToFit = true,
}: ExpenseActionTileContentProps) {
  return (
    <>
      {participant ? (
        <ParticipantAvatar participant={participant} />
      ) : (
        <View className="size-12 items-center justify-center rounded-full bg-page">
          {icon ? <HugeiconsIcon icon={icon} size={24} color="#000000" /> : null}
        </View>
      )}
      <Typography
        adjustsFontSizeToFit={adjustsFontSizeToFit}
        className={labelClassName}
        ellipsizeMode="tail"
        minimumFontScale={adjustsFontSizeToFit ? 0.85 : undefined}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </>
  );
}

type ExpenseSelectionOption = {
  value: string;
  label: string;
  icon?: HugeiconsProps["icon"];
  participant?: ActionParticipant;
};

type ExpenseSelectionSheetProps = {
  title: string;
  value: string;
  options: readonly ExpenseSelectionOption[];
  triggerLabel: string;
  triggerIcon?: HugeiconsProps["icon"];
  triggerParticipant?: ActionParticipant;
  triggerLabelClassName?: string;
  adjustTriggerLabelSize?: boolean;
  accessibilityLabel: string;
  isDisabled?: boolean;
  renderTrigger?: (label: string) => ReactNode;
  onSubmit: (value: string) => void;
};

const SELECTION_ITEM_HEIGHT = 48;

export function ExpenseSelectionSheet({
  title,
  value,
  options,
  triggerLabel,
  triggerIcon,
  triggerParticipant,
  triggerLabelClassName,
  adjustTriggerLabelSize = true,
  accessibilityLabel,
  isDisabled = false,
  renderTrigger,
  onSubmit,
}: ExpenseSelectionSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const listPadding = 8;
  const listHeight = options.length * SELECTION_ITEM_HEIGHT + Math.max(options.length - 1, 0) * 4;
  const pickerHeight = Math.min(
    windowHeight * 0.7,
    32 + 16 + listHeight + listPadding * 2 + 16 + 40 + 32,
  );
  const selectedOption = options.find((option) => option.value === draftValue);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (open) {
      setDraftValue(value);
      Keyboard.dismiss();
    }
  };

  return (
    <View className={renderTrigger ? undefined : "flex-1"}>
      <Select
        isDisabled={isDisabled}
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        onValueChange={(option) => setDraftValue(option?.value ?? draftValue)}
        presentation="bottom-sheet"
        value={selectedOption}
      >
        <Select.Trigger variant="unstyled" asChild>
          {renderTrigger ? (
            renderTrigger(triggerLabel)
          ) : (
            <PressableFeedback
              accessibilityLabel={accessibilityLabel}
              accessibilityRole="button"
              className={`flex-1 items-center gap-1 rounded-xl px-1 py-1${
                isDisabled ? " opacity-50" : ""
              }`}
              isDisabled={isDisabled}
            >
              <ExpenseActionTileContent
                adjustsFontSizeToFit={adjustTriggerLabelSize}
                labelClassName={triggerLabelClassName}
                icon={triggerIcon}
                label={triggerLabel}
                participant={triggerParticipant}
              />
            </PressableFeedback>
          )}
        </Select.Trigger>
        <Select.Portal>
          <Select.Overlay className="bg-black/20" />
          <Select.Content
            detached
            bottomInset={insets.bottom + 12}
            className="mx-4 overflow-hidden"
            backgroundClassName="rounded-[32px]"
            contentContainerClassName="h-full gap-4 p-4"
            enableDynamicSizing={false}
            enableOverDrag={false}
            handleComponent={null}
            presentation="bottom-sheet"
            snapPoints={[pickerHeight]}
          >
            <View className="flex-row items-center justify-between gap-4">
              <Typography className="text-lg font-normal text-ink">{title}</Typography>
              <Button
                isIconOnly
                variant="secondary"
                className="size-8 rounded-full bg-page"
                accessibilityLabel={`Close ${title.toLowerCase()} sheet`}
                onPress={() => setIsOpen(false)}
              >
                <HugeiconsIcon icon={X} size={16} color="#000000" />
              </Button>
            </View>

            <BottomSheetScrollView
              className="flex-1"
              contentContainerStyle={{ gap: 4, paddingVertical: listPadding }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  label={option.label}
                  closeOnPress={false}
                  className="p-0"
                  disabled={isDisabled}
                >
                  {({ isSelected }) => (
                    <View
                      className="min-h-12 flex-1 flex-row items-center gap-3 rounded-xl px-2"
                      style={{
                        borderColor: "#000000",
                        borderRadius: 12,
                        borderWidth: isSelected ? 1 : 0,
                      }}
                    >
                      {option.participant ? (
                        <Avatar className="size-10 bg-page" size="sm" alt={option.participant.name}>
                          {option.participant.image ? (
                            <Avatar.Image source={{ uri: option.participant.image }} />
                          ) : null}
                          <Avatar.Fallback>
                            <Typography className="text-sm text-ink">
                              {option.participant.name.slice(0, 1).toUpperCase()}
                            </Typography>
                          </Avatar.Fallback>
                        </Avatar>
                      ) : option.icon ? (
                        <View className="size-10 items-center justify-center">
                          <HugeiconsIcon icon={option.icon} size={24} color="#000000" />
                        </View>
                      ) : null}
                      <Select.ItemLabel className="flex-1 text-sm text-ink" numberOfLines={1} />
                      {isSelected ? <HugeiconsIcon icon={Check} size={16} color="#000000" /> : null}
                    </View>
                  )}
                </Select.Item>
              ))}
            </BottomSheetScrollView>

            <Button
              className="w-full bg-dark-gradient"
              isDisabled={isDisabled}
              onPress={() => {
                onSubmit(draftValue);
                setIsOpen(false);
              }}
            >
              <Button.Label>Submit</Button.Label>
            </Button>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}

export function splitMethodLabel(method: SplitMethod) {
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
    <View className="rounded-2xl bg-panel p-4">
      <View className="flex-row items-center gap-1">
        <ExpenseSelectionSheet
          title="Participants"
          value={payer}
          options={participantOptions}
          triggerLabel={payerParticipant?.name ?? "Payer"}
          triggerParticipant={payerParticipant}
          accessibilityLabel="Select who paid"
          isDisabled={isDisabled || participants.length === 0}
          onSubmit={(email) => onPayerChange(email)}
        />
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
        <CategorySelection
          key={categoryResetKey}
          isDisabled={isDisabled}
          onCategoryChange={onCategoryChange}
        />
      </View>
    </View>
  );
}
