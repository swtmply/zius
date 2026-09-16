import {
  Add,
  ChevronLeft,
  Check,
  SaleTag01Icon,
  Split,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Button, PressableFeedback, Typography } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ExpenseActionTileContent } from "@/components/forms/expense/expense-action-tile-content";

import { SpotlightContainer } from "../spotlight-container";
import { SpotlightOverlay } from "../spotlight-overlay";
import { SpotlightProvider, useSpotlight } from "../spotlight-provider";
import { SpotlightTarget } from "../spotlight-target";

const STEPS = [
  "price",
  "payer",
  "split-method",
  "groups",
  "category",
  "item",
  "unassigned",
  "submit",
] as const;

type Step = (typeof STEPS)[number];

const STEP_HINTS: Record<Step, { title: string; description: string }> = {
  price: {
    title: "Start with the total",
    description: "Enter the full amount of the expense here.",
  },
  payer: {
    title: "Choose the payer",
    description: "Select the participant who paid for the expense.",
  },
  "split-method": {
    title: "Choose a split method",
    description: "Split the total equally, by amount, percentage, or item.",
  },
  groups: {
    title: "Add a group",
    description: "Keep this expense with the people you share it with.",
  },
  category: {
    title: "Add a category",
    description: "Use a category to find similar expenses later.",
  },
  item: {
    title: "Add the items",
    description: "Items let you split a receipt line by line.",
  },
  unassigned: {
    title: "Assign each item",
    description: "Choose who owes each item, or leave it unassigned for now.",
  },
  submit: {
    title: "Submit the expense",
    description: "Review the details, then tap the checkmark to save it.",
  },
};

const noop = () => undefined;

const waitForLayout = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

export type MockCreateExpenseProps = {
  onComplete: () => void | Promise<void>;
};

export function MockCreateExpense({ onComplete }: MockCreateExpenseProps) {
  return (
    <SpotlightProvider>
      <MockCreateExpenseContent onComplete={onComplete} />
    </SpotlightProvider>
  );
}

function MockCreateExpenseContent({ onComplete }: MockCreateExpenseProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const { target, focusTarget } = useSpotlight();
  const step = STEPS[stepIndex] ?? STEPS[0];

  useEffect(() => {
    let cancelled = false;

    const focusStep = async () => {
      if (step === "item" || step === "unassigned") {
        scrollRef.current?.scrollToEnd({ animated: false });
      } else {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }

      await waitForLayout();

      if (!cancelled) {
        await focusTarget(step);
      }
    };

    void focusStep();

    return () => {
      cancelled = true;
    };
  }, [focusTarget, step]);

  const nextStep = () => {
    if (stepIndex === STEPS.length - 1) {
      void onComplete();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  return (
    <View
      className="bg-page flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="gap-4 px-4 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between py-4">
          <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={noop}>
            <HugeiconsIcon icon={ChevronLeft} size={24} />
          </Button>
          <Typography className="text-2xl font-semibold">Create Expense</Typography>
          <SpotlightTarget id="submit">
            <Button isIconOnly variant="ghost" accessibilityLabel="Submit expense" onPress={noop}>
              <HugeiconsIcon icon={Check} size={24} />
            </Button>
          </SpotlightTarget>
        </View>

        <SpotlightTarget id="price">
          <Button variant="ghost" className="h-24 w-full" onPress={noop}>
            <Typography className="text-2xl font-semibold text-ink" selectable>
              ₱1,500.00
            </Typography>
          </Button>
        </SpotlightTarget>

        <View className="h-14 flex-row items-center rounded-2xl bg-panel px-4">
          <Typography className="text-sm text-ink">Title</Typography>
          <TextInput
            value="Dinner at Manam"
            editable={false}
            accessibilityLabel="Expense title"
            className="flex-1 text-sm text-ink"
          />
        </View>

        <View className="rounded-2xl bg-panel p-4">
          <View className="flex-row items-center gap-1">
            <SpotlightTarget id="payer" className="flex-1">
              <PressableFeedback
                accessibilityLabel="Select who paid"
                accessibilityRole="button"
                className="flex-1 items-center gap-1 rounded-xl px-1 py-1"
                onPress={noop}
              >
                <ExpenseActionTileContent label="Alex" participant={{ name: "Alex" }} />
              </PressableFeedback>
            </SpotlightTarget>
            <SpotlightTarget id="split-method" className="flex-1">
              <PressableFeedback
                accessibilityLabel="Choose split method"
                accessibilityRole="button"
                className="flex-1 items-center gap-1 rounded-xl px-1 py-1"
                onPress={noop}
              >
                <ExpenseActionTileContent icon={Split} label="Items" />
              </PressableFeedback>
            </SpotlightTarget>
            <SpotlightTarget id="groups" className="flex-1">
              <PressableFeedback
                accessibilityLabel="Select group"
                accessibilityRole="button"
                className="flex-1 items-center gap-1 rounded-xl px-1 py-1"
                onPress={noop}
              >
                <ExpenseActionTileContent icon={UserGroup03Icon} label="Groups" />
              </PressableFeedback>
            </SpotlightTarget>
            <SpotlightTarget id="category" className="flex-1">
              <PressableFeedback
                accessibilityLabel="Choose category"
                accessibilityRole="button"
                className="flex-1 items-center gap-1 rounded-xl px-1 py-1"
                onPress={noop}
              >
                <ExpenseActionTileContent icon={SaleTag01Icon} label="Category" />
              </PressableFeedback>
            </SpotlightTarget>
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-4">
            <Typography className="text-ink">Participants</Typography>
            <Button
              size="sm"
              className="h-8 min-h-0 gap-2 rounded-full bg-dark-gradient px-3"
              onPress={noop}
            >
              <HugeiconsIcon icon={Add} size={16} color="#FFFFFF" />
              <Button.Label className="text-xs font-normal text-white">
                Add Participant
              </Button.Label>
            </Button>
          </View>
          <View className="rounded-2xl bg-panel px-4">
            {[
              ["Alex", "₱750.00"],
              ["Sam", "₱750.00"],
            ].map(([name, amount], index) => (
              <View
                key={name}
                className={`flex-row items-center gap-2 py-2${index > 0 ? " border-t border-dashed border-border" : ""}`}
              >
                <View className="size-8 items-center justify-center rounded-full bg-page">
                  <Typography className="text-xs text-ink">{name.slice(0, 1)}</Typography>
                </View>
                <Typography className="flex-1 text-sm text-ink">{name}</Typography>
                <Typography className="text-xs font-semibold text-ink">{amount}</Typography>
                <Typography className="text-[10px] font-semibold text-supporting">PHP</Typography>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-2">
          <View className="flex-row items-center justify-between gap-4">
            <Typography className="text-ink">Expense Summary</Typography>
            <Button
              size="sm"
              className="h-8 min-h-0 gap-2 rounded-full bg-dark-gradient px-3"
              onPress={noop}
            >
              <HugeiconsIcon icon={Add} size={16} color="#FFFFFF" />
              <Button.Label className="text-xs font-normal text-white">Add Item</Button.Label>
            </Button>
          </View>
          <View className="rounded-2xl bg-panel px-4">
            <View className="gap-2 py-2">
              <View className="flex-row items-center gap-1">
                <TextInput
                  value="1"
                  editable={false}
                  accessibilityLabel="Quantity for Dinner at Manam"
                  className="h-8 w-7 rounded-lg border border-border bg-page px-1 py-0 text-center text-xs text-ink"
                />
                <SpotlightTarget id="item" className="min-w-0 flex-1">
                  <TextInput
                    value="Dinner at Manam"
                    editable={false}
                    accessibilityLabel="Name for Dinner at Manam"
                    className="h-8 flex-1 rounded-lg border border-border bg-page px-2 py-0 text-xs text-ink"
                  />
                </SpotlightTarget>
                <TextInput
                  value="1500.00"
                  editable={false}
                  accessibilityLabel="Price for Dinner at Manam"
                  className="h-8 w-16 rounded-lg border border-border bg-page px-2 py-0 text-right text-xs font-semibold text-ink"
                />
                <Typography className="text-[10px] font-semibold text-supporting">PHP</Typography>
                <Button
                  accessibilityLabel="Remove Dinner at Manam"
                  isIconOnly
                  className="size-7 rounded-full"
                  variant="ghost"
                  onPress={noop}
                >
                  <Typography className="text-sm text-supporting">×</Typography>
                </Button>
              </View>
              <SpotlightTarget id="unassigned" className="self-start">
                <PressableFeedback
                  accessibilityLabel="Assign Dinner at Manam to a participant"
                  accessibilityRole="button"
                  className="self-start flex-row items-center gap-2 rounded-full bg-page px-2 py-1"
                  onPress={noop}
                >
                  <Typography className="text-xs text-ink">Unassigned</Typography>
                </PressableFeedback>
              </SpotlightTarget>
            </View>
          </View>
        </View>
      </ScrollView>

      {target ? (
        <SpotlightOverlay
          target={target}
          onPress={nextStep}
          accessibilityLabel={step === "submit" ? "Finish expense spotlight" : "Next spotlight"}
        />
      ) : null}

      <SpotlightContainer
        className="w-72 rounded-2xl bg-panel px-4 py-3 shadow-lg"
        style={{ minHeight: 80 }}
        accessibilityRole="summary"
      >
        <Typography className="text-sm font-semibold text-ink">{STEP_HINTS[step].title}</Typography>
        <Typography className="text-xs text-supporting">{STEP_HINTS[step].description}</Typography>
      </SpotlightContainer>
    </View>
  );
}

export default MockCreateExpense;
