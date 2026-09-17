import { Check, X } from "@hugeicons/core-free-icons";
import type { HugeiconsProps } from "@hugeicons/react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Avatar, Button, PressableFeedback, Select, Typography } from "heroui-native";
import { useState, type ReactNode } from "react";
import { Keyboard, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExpenseActionTileContent, type ActionParticipant } from "./expense-action-tile-content";

import { Icon } from "@/components/icon";

export type ExpenseSelectionOption = {
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
                <Icon icon={X} size={16} colorClassName="accent-ink" />
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
                      className="min-h-12 flex-1 flex-row items-center gap-3 rounded-xl border-ink px-2"
                      style={{
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
                          <Icon icon={option.icon} size={24} colorClassName="accent-ink" />
                        </View>
                      ) : null}
                      <Select.ItemLabel className="flex-1 text-sm text-ink" numberOfLines={1} />
                      {isSelected ? (
                        <Icon icon={Check} size={16} colorClassName="accent-ink" />
                      ) : null}
                    </View>
                  )}
                </Select.Item>
              ))}
            </BottomSheetScrollView>

            <Button
              className="w-full bg-contrast-gradient"
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
