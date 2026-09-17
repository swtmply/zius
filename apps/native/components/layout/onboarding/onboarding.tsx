import { Typography } from "heroui-native";
import { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
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
    image: require("../assets/images/hand-coins.png"),
    imageLabel: "A hand dropping coins into another hand",
    title: "Keep money matters simple",
    description: "Track who paid, who owes, and settle up without awkward math.",
  },
  {
    image: require("../assets/images/camera.png"),
    imageLabel: "A camera for scanning receipts",
    title: "Scan receipts in a snap",
    description: "Capture a receipt and turn it into an expense in seconds.",
  },
  {
    image: require("../assets/images/hand-like.png"),
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
    <View style={styles.progressBar}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.progressFill, style]} />
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
          const projectedDelta =
            translateX.get() - gestureStartX.get() + project(event.velocityX);
          const step = Math.abs(projectedDelta) > width * 0.2 ? Math.sign(projectedDelta) : 0;
          const nextIndex = Math.max(
            minIndex,
            Math.min(maxIndex, currentIndex - step),
          );

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
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.progressRow, { marginTop: insets.top + 20 }]}>
        {ONBOARDING_PAGES.map((_, index) => (
          <ProgressBar key={index} index={index} translateX={translateX} width={width} />
        ))}
      </View>

      <GestureDetector gesture={pan}>
        <View style={styles.viewport}>
          <Animated.View
            style={[styles.pageTrack, { width: width * ONBOARDING_PAGES.length }, pageTrackStyle]}
          >
            {ONBOARDING_PAGES.map((page, index) => (
              <View
                key={page.title}
                style={[styles.page, { width }]}
                accessibilityElementsHidden={index !== pageIndex}
                importantForAccessibility={index === pageIndex ? "yes" : "no-hide-descendants"}
              >
                <View style={styles.pageContent}>
                  <Image
                    source={page.image}
                    accessible
                    accessibilityLabel={page.imageLabel}
                    resizeMode="contain"
                    style={{ width: imageSize, height: imageSize }}
                  />
                  <Typography className="!text-black text-center text-2xl font-semibold" style={styles.title}>
                    {page.title}
                  </Typography>
                  <Typography
                    className="!text-[#3C3C43] max-w-[290px] text-center text-xs leading-[17px]"
                    style={styles.description}
                  >
                    {page.description}
                  </Typography>
                  <Pressable
                    testID={`onboarding-action-${index}`}
                    accessibilityRole="button"
                    accessibilityLabel={index === ONBOARDING_PAGES.length - 1 ? "Get started" : "Continue"}
                    onPress={() => handleAction(index)}
                    style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
                  >
                    <Typography className="!text-white text-sm" style={styles.actionLabel}>
                      {index === ONBOARDING_PAGES.length - 1 ? "Get Started" : "Continue"}
                    </Typography>
                  </Pressable>
                </View>
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    height: 8,
    marginHorizontal: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    overflow: "hidden",
    borderRadius: 99,
    backgroundColor: "#D1D1D6",
  },
  progressFill: {
    borderRadius: 99,
    backgroundColor: "#000000",
  },
  title: {
    color: "#000000",
  },
  description: {
    color: "#3C3C43",
  },
  viewport: {
    flex: 1,
    overflow: "hidden",
  },
  pageTrack: {
    flex: 1,
    flexDirection: "row",
  },
  page: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  pageContent: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  action: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderCurve: "continuous",
    backgroundColor: "#202020",
  },
  actionPressed: {
    opacity: 0.72,
  },
  actionLabel: {
    color: "#FFFFFF",
  },
});
