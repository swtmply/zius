import { useEffect } from "react";
import { Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { SPOTLIGHT_TRANSITION } from "./spotlight-animation";

export type SpotlightRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SpotlightOverlayProps = {
  target?: SpotlightRect;
  onPress?: () => void;
  accessibilityLabel?: string;
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function SpotlightOverlay({
  target,
  onPress,
  accessibilityLabel = "Next",
}: SpotlightOverlayProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const initialSize = Math.min(140, screenWidth - 48);

  const initialRect = {
    x: (screenWidth - initialSize) / 2,
    y: insets.top + 24,
    width: initialSize,
    height: initialSize,
  };

  const x = useSharedValue(initialRect.x);
  const y = useSharedValue(initialRect.y);
  const width = useSharedValue(initialRect.width);
  const height = useSharedValue(initialRect.height);

  useEffect(() => {
    if (!target) return;

    const transition = reducedMotion ? { duration: 0 } : SPOTLIGHT_TRANSITION;

    x.set(withTiming(target.x, transition));
    y.set(withTiming(target.y, transition));
    width.set(withTiming(target.width, transition));
    height.set(withTiming(target.height, transition));
  }, [target, reducedMotion, x, y, width, height]);

  const animatedProps = useAnimatedProps(() => {
    const left = x.get();
    const top = y.get();
    const targetWidth = width.get();
    const targetHeight = height.get();
    const right = left + targetWidth;
    const bottom = top + targetHeight;
    const radius = Math.max(0, Math.min(16, targetWidth / 2, targetHeight / 2));

    // The inner contour cuts a hole without full-screen mask compositing.
    return {
      d: `M0 0 H${screenWidth} V${screenHeight} H0 Z
          M${left + radius} ${top}
          H${right - radius} A${radius} ${radius} 0 0 1 ${right} ${top + radius}
          V${bottom - radius} A${radius} ${radius} 0 0 1 ${right - radius} ${bottom}
          H${left + radius} A${radius} ${radius} 0 0 1 ${left} ${bottom - radius}
          V${top + radius} A${radius} ${radius} 0 0 1 ${left + radius} ${top} Z`,
    };
  });

  const overlay = (
    <Svg
      pointerEvents="none"
      width={screenWidth}
      height={screenHeight}
      style={StyleSheet.absoluteFill}
    >
      <AnimatedPath animatedProps={animatedProps} fill="rgba(0, 0, 0, 0.65)" fillRule="evenodd" />
    </Svg>
  );

  if (!onPress) return overlay;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      className="absolute inset-0"
    >
      {overlay}
    </Pressable>
  );
}
