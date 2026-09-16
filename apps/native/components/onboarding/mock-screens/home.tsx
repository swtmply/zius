import {
  Add,
  MoreHorizontal,
  Notification,
  Scan,
  TransactionHistoryIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Avatar, Button, Typography } from "heroui-native";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  DashboardHeaderCard,
  type HeaderCardAction,
} from "@/components/dashboard/header-card";
import {
  ExpenseCard,
  type DashboardExpense,
} from "@/components/dashboard/expense-card";
import { SpotlightOverlay } from "../spotlight-overlay";
import { SpotlightProvider, useSpotlight } from "../spotlight-provider";
import { SpotlightContainer } from "../spotlight-container";
import { SpotlightTarget } from "../spotlight-target";

const mockParticipants = [
  {
    id: "mock-participant-1",
    name: "Alex",
    email: "alex@example.com",
    image: null,
  },
  {
    id: "mock-participant-2",
    name: "Sam",
    email: "sam@example.com",
    image: null,
  },
  {
    id: "mock-participant-3",
    name: "Jamie",
    email: "jamie@example.com",
    image: null,
  },
];

const mockUnsettledExpense = {
  id: "mock-unsettled-expense",
  title: "Dinner at Manam",
  category: "food",
  iconName: "Restaurant01Icon",
  totalMinor: 150000,
  currency: "PHP",
  occurredAt: "2026-09-01T19:30:00.000Z",
  status: "active",
  participants: mockParticipants,
} satisfies DashboardExpense;

const mockSettledExpense = {
  id: "mock-settled-expense",
  title: "Weekend groceries",
  category: "shopping",
  iconName: "ShoppingBag01Icon",
  totalMinor: 87500,
  currency: "PHP",
  occurredAt: "2026-08-28T15:00:00.000Z",
  status: "settled",
  participants: mockParticipants.slice(0, 2),
} satisfies DashboardExpense;

const noop = () => undefined;

const mockHeaderActions = [
  {
    id: "expense",
    label: "Expense",
    accessibilityLabel: "Create expense",
    icon: Add,
    onPress: noop,
  },
  {
    id: "groups",
    label: "Groups",
    accessibilityLabel: "View groups",
    icon: UserGroup03Icon,
    onPress: noop,
  },
  {
    id: "history",
    label: "History",
    accessibilityLabel: "View history",
    icon: TransactionHistoryIcon,
    onPress: noop,
  },
  {
    id: "more",
    label: "More",
    accessibilityLabel: "More settings",
    icon: MoreHorizontal,
    onPress: noop,
  },
] satisfies readonly HeaderCardAction[];

function MockDashboardHeader() {
  return (
    <View className="pt-4 flex-row items-center justify-between">
      <Typography className="text-2xl font-semibold text-ink">
        Dashboard
      </Typography>

      <View className="flex-row items-center gap-2">
        <Button
          variant="ghost"
          isIconOnly
          accessibilityLabel="Notifications"
          onPress={noop}
        >
          <HugeiconsIcon icon={Notification} size={24} color="#000000" />
        </Button>
        <Avatar size="md">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar>
      </View>
    </View>
  );
}

function MockExpenseSection({
  title,
  expense,
}: {
  title: string;
  expense: DashboardExpense;
}) {
  return (
    <>
      <View className="flex-row items-center justify-between gap-4">
        <Typography className="text-ink">{title}</Typography>
        <Button
          variant="ghost"
          onPress={noop}
          accessibilityLabel={`See all ${title.toLowerCase()}`}
        >
          <Typography className="text-sm text-supporting">See All</Typography>
        </Button>
      </View>
      <View className="gap-2">
        <ExpenseCard expense={expense} />
      </View>
    </>
  );
}

type MockHomeProps = {
  onComplete: () => void | Promise<void>;
};

export function MockHome({ onComplete }: MockHomeProps) {
  return (
    <SpotlightProvider>
      <MockContent onComplete={onComplete} />
    </SpotlightProvider>
  );
}

const STEPS = ["header", "unsettled", "settled", "scan"] as const;
type Step = (typeof STEPS)[number];

const STEP_HINTS = {
  header: {
    title: "Your balance at a glance",
    description:
      "See what you owe and what others owe you. And control links to find out more.",
  },
  unsettled: {
    title: "Keep track of open expenses",
    description: "Review the expenses that still need to be settled.",
  },
  settled: {
    title: "Your settled history",
    description: "Find completed expenses here whenever you need them.",
  },
  scan: {
    title: "Scan a receipt",
    description: "Create an expense faster by scanning its receipt.",
  },
} as const;

const SWIPE_COMMIT_DISTANCE = 48;
const HINT_TRANSITION = {
  duration: 220,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
};

function isStep(value: string | null): value is Step {
  return value !== null && STEPS.includes(value as Step);
}

function OnboardingHint({
  step,
  stepIndex,
  onContinue,
}: {
  step: Step;
  stepIndex: number;
  onContinue: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const previousStepIndex = useRef(stepIndex);
  const contentProgress = useSharedValue(1);
  const contentDirection = useSharedValue(1);

  useEffect(() => {
    const previousIndex = previousStepIndex.current;

    if (previousIndex === stepIndex) return;

    previousStepIndex.current = stepIndex;
    contentDirection.set(stepIndex > previousIndex ? 1 : -1);
    contentProgress.set(reducedMotion ? 1 : 0);
    contentProgress.set(
      withTiming(1, reducedMotion ? { duration: 0 } : HINT_TRANSITION),
    );
  }, [reducedMotion, stepIndex, contentDirection, contentProgress]);

  const contentStyle = useAnimatedStyle(() => {
    const progress = contentProgress.get();

    return {
      opacity: reducedMotion ? 1 : progress,
      transform: [
        {
          translateX: reducedMotion
            ? 0
            : interpolate(progress, [0, 1], [contentDirection.get() * 18, 0]),
        },
      ],
    };
  }, [reducedMotion]);

  return (
    <Animated.View style={contentStyle}>
      <Typography className="text-sm font-semibold text-ink">
        {STEP_HINTS[step].title}
      </Typography>
      <Typography className="text-xs text-supporting">
        {STEP_HINTS[step].description}
      </Typography>
    </Animated.View>
  );
}

function MockContent({ onComplete }: MockHomeProps) {
  const insets = useSafeAreaInsets();

  const { activeTargetId, target, focusTarget } = useSpotlight();
  const step = isStep(activeTargetId) ? activeTargetId : STEPS[0];
  const stepIndex = STEPS.indexOf(step);
  const currentStepIndex = useRef(stepIndex);
  const isCompleting = useRef(false);

  useEffect(() => {
    currentStepIndex.current = stepIndex;
  }, [stepIndex]);

  const goToStep = useCallback(
    (nextIndex: number) => {
      if (isCompleting.current) return;

      if (nextIndex >= STEPS.length) {
        isCompleting.current = true;
        void onComplete();
        return;
      }

      if (nextIndex < 0 || nextIndex === currentStepIndex.current) return;

      currentStepIndex.current = nextIndex;
      void focusTarget(STEPS[nextIndex] ?? STEPS[0]);
    },
    [focusTarget, onComplete],
  );

  const nextTarget = useCallback(() => {
    goToStep(currentStepIndex.current + 1);
  }, [goToStep]);

  const handleSwipe = useCallback(
    (direction: 1 | -1) => {
      goToStep(currentStepIndex.current + direction);
    },
    [goToStep],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-18, 18])
        .onEnd((event) => {
          const projectedDistance = event.translationX + event.velocityX * 0.15;

          if (projectedDistance <= -SWIPE_COMMIT_DISTANCE) {
            scheduleOnRN(handleSwipe, 1);
          } else if (projectedDistance >= SWIPE_COMMIT_DISTANCE) {
            scheduleOnRN(handleSwipe, -1);
          }
        }),
    [handleSwipe],
  );

  useEffect(() => {
    void focusTarget(STEPS[0]);
  }, [focusTarget]);

  return (
    <GestureDetector gesture={panGesture}>
      <View
        className="bg-page flex-1"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}
      >
        <ScrollView
          contentContainerClassName="p-4 gap-2"
          showsVerticalScrollIndicator={false}
        >
          <MockDashboardHeader />

          <SpotlightTarget id="header">
            <DashboardHeaderCard
              owedToYouMinor={120000}
              youOweMinor={75000}
              actions={mockHeaderActions}
            />
          </SpotlightTarget>
          <SpotlightTarget id="unsettled">
            <MockExpenseSection
              title="Unsettled Expenses"
              expense={mockUnsettledExpense}
            />
          </SpotlightTarget>
          <SpotlightTarget id="settled">
            <MockExpenseSection
              title="Settled Expenses"
              expense={mockSettledExpense}
            />
          </SpotlightTarget>
          <View className="h-14" />
        </ScrollView>
        <SpotlightTarget
          id="scan"
          className="absolute right-4"
          style={{
            bottom: insets.bottom + 16,
          }}
        >
          <Button
            className="size-18 rounded-full bg-dark-gradient"
            isIconOnly
            accessibilityLabel="Scan receipt"
            onPress={noop}
          >
            <HugeiconsIcon icon={Scan} size={28} color="#FFFFFF" />
          </Button>
        </SpotlightTarget>

        {target && (
          <SpotlightOverlay
            target={target}
            onPress={nextTarget}
            accessibilityLabel="Next spotlight"
          />
        )}

        <SpotlightContainer
          className="w-72 rounded-2xl bg-panel px-4 py-3 shadow-lg"
          style={{ minHeight: 80 }}
          accessibilityRole="summary"
        >
          <OnboardingHint
            step={step}
            stepIndex={stepIndex}
            onContinue={nextTarget}
          />
        </SpotlightContainer>
      </View>
    </GestureDetector>
  );
}

export default MockHome;
