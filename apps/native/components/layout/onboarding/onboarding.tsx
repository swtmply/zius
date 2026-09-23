import { Button, Typography } from "heroui-native";
import { useMemo, useState } from "react";
import { Image, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

const ONBOARDING_PAGES = [
  {
    image: require("../../../assets/images/hand-coins.png"),
    imageLabel: "A hand dropping coins into another hand",
    title: "Keep money matters simple",
    description: "Track who paid, who owes, and settle up without awkward math.",
  },
  {
    image: require("../../../assets/images/camera.png"),
    imageLabel: "A camera for scanning receipts",
    title: "Scan receipts in a snap",
    description: "Capture a receipt and turn it into an expense in seconds.",
  },
  {
    image: require("../../../assets/images/hand-like.png"),
    imageLabel: "A thumbs-up hand",
    title: "Split expenses with ease",
    description: "Create groups, share costs, and stay on top of every balance.",
  },
] as const;

const EASE_SPRING = {
  duration: 400,
  dampingRatio: 0.8,
  overshootClamping: true,
  reduceMotion: ReduceMotion.System,
} as const;

function project(velocity: number) {
  "worklet";
  const decelerationRate = 0.998;
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function rubberband(overshoot: number, dimension: number) {
  "worklet";
  const constant = 0.55;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function ProgressBar({
  index,
  translateX,
  width,
}: {
  index: number;
  translateX: SharedValue<number>;
  width: number;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(
      width ? -translateX.get() / width : 0,
      [index - 1, index, index + 1],
      [0, 1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View className="flex-1 h-2 overflow-hidden rounded-full bg-default">
      <Animated.View className="absolute inset-0 rounded-full bg-ink" style={style} />
    </View>
  );
}

export function Onboarding({ onComplete }: { onComplete: () => void | Promise<void> }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [pageIndex, setPageIndex] = useState(0);
  const translateX = useSharedValue(0);
  const gestureStartX = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const imageSize = Math.min(width * 0.72, 280);
  const pageTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-16, 16])
        .onStart(() => {
          gestureStartX.set(translateX.get());
        })
        .onUpdate((event) => {
          const minX = -(ONBOARDING_PAGES.length - 1) * width;
          const nextX = gestureStartX.get() + event.translationX;

          translateX.set(
            nextX > 0
              ? rubberband(nextX, width)
              : nextX < minX
                ? minX + rubberband(nextX - minX, width)
                : nextX,
          );
        })
        .onEnd((event) => {
          const minIndex = 0;
          const maxIndex = ONBOARDING_PAGES.length - 1;
          const currentIndex = Math.max(
            minIndex,
            Math.min(maxIndex, Math.round(-gestureStartX.get() / width)),
          );
          const projectedDelta = translateX.get() - gestureStartX.get() + project(event.velocityX);
          const step = Math.abs(projectedDelta) > width * 0.2 ? Math.sign(projectedDelta) : 0;
          const nextIndex = Math.max(minIndex, Math.min(maxIndex, currentIndex - step));

          translateX.set(
            withSpring(-nextIndex * width, {
              ...EASE_SPRING,
              velocity: event.velocityX,
            }),
          );
          scheduleOnRN(setPageIndex, nextIndex);
        }),
    [translateX, gestureStartX, width],
  );

  function goToPage(index: number) {
    setPageIndex(index);
    translateX.set(
      withSpring(-index * width, {
        ...EASE_SPRING,
        reduceMotion: reducedMotion ? ReduceMotion.Always : ReduceMotion.System,
      }),
    );
  }

  function handleAction(index: number) {
    if (index === ONBOARDING_PAGES.length - 1) {
      void onComplete();
      return;
    }

    goToPage(index + 1);
  }

  return (
    <View className="flex-1 bg-page">
      <StatusBar style="auto" />

      <View className="mx-4 h-2 flex-row gap-1" style={{ marginTop: insets.top + 20 }}>
        {ONBOARDING_PAGES.map((_, index) => (
          <ProgressBar key={index} index={index} translateX={translateX} width={width} />
        ))}
      </View>

      <GestureDetector gesture={pan}>
        <View className="flex-1 overflow-hidden">
          <Animated.View
            className="flex-1 flex-row"
            style={[{ width: width * ONBOARDING_PAGES.length }, pageTrackStyle]}
          >
            {ONBOARDING_PAGES.map((page, index) => (
              <View
                key={page.title}
                className="items-center justify-center px-4 pb-4"
                style={{ width }}
                accessibilityElementsHidden={index !== pageIndex}
                importantForAccessibility={index === pageIndex ? "yes" : "no-hide-descendants"}
              >
                <View className="w-full items-center gap-4">
                  <Image
                    source={page.image}
                    accessible
                    accessibilityLabel={page.imageLabel}
                    resizeMode="contain"
                    style={{ width: imageSize, height: imageSize }}
                  />
                  <Typography className="!text-ink text-center text-2xl font-semibold">
                    {page.title}
                  </Typography>
                  <Typography className="!text-muted max-w-[290px] text-center text-xs leading-[17px]">
                    {page.description}
                  </Typography>
                  <Button
                    testID={`onboarding-action-${index}`}
                    accessibilityLabel={
                      index === ONBOARDING_PAGES.length - 1 ? "Get started" : "Continue"
                    }
                    onPress={() => handleAction(index)}
                    className="h-[50px] w-full rounded-2xl border-continuous bg-ink"
                  >
                    <Button.Label className="text-sm text-on-ink">
                      {index === ONBOARDING_PAGES.length - 1 ? "Get Started" : "Continue"}
                    </Button.Label>
                  </Button>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}
