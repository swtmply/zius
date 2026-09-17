import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { SPOTLIGHT_TRANSITION } from "./spotlight-animation";
import type { SpotlightRect } from "./spotlight-overlay";
import { useSpotlight } from "./spotlight-provider";

export type SpotlightContainerPlacement = "auto" | "top" | "bottom";

type ContentSize = {
  width: number;
  height: number;
};

export type SpotlightContainerPosition = {
  left: number;
  top: number;
  placement: Exclude<SpotlightContainerPlacement, "auto">;
};

export type SpotlightContainerProps = Omit<ViewProps, "onLayout"> & {
  children: ReactNode;
  /** How the container should be placed relative to the active target. */
  placement?: SpotlightContainerPlacement;
  /** Space between the target and the container. */
  offset?: number;
  /** Minimum distance from the screen edges. */
  edgePadding?: number;
  onLayout?: (event: LayoutChangeEvent) => void;
  style?: StyleProp<ViewStyle>;
};

type CalculatePositionOptions = {
  target: SpotlightRect;
  contentSize: ContentSize;
  screenWidth: number;
  screenHeight: number;
  topInset: number;
  bottomInset: number;
  placement: SpotlightContainerPlacement;
  offset: number;
  edgePadding: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum);

/**
 * Calculates a coachmark position without relying on a particular rendered
 * component. Keeping this separate makes the edge and placement rules easy to
 * reason about and reuse.
 */
export function calculateSpotlightContainerPosition({
  target,
  contentSize,
  screenWidth,
  screenHeight,
  topInset,
  bottomInset,
  placement,
  offset,
  edgePadding,
}: CalculatePositionOptions): SpotlightContainerPosition {
  const topBoundary = Math.max(topInset, edgePadding);
  const bottomBoundary = Math.max(topBoundary, screenHeight - Math.max(bottomInset, edgePadding));
  const minimumLeft = Math.max(0, edgePadding);
  const maximumLeft = Math.max(minimumLeft, screenWidth - edgePadding - contentSize.width);
  const left = clamp(target.x + (target.width - contentSize.width) / 2, minimumLeft, maximumLeft);

  const spaceAbove = target.y - topBoundary - offset;
  const spaceBelow = bottomBoundary - target.y - target.height - offset;
  const canFitAbove = spaceAbove >= contentSize.height;
  const canFitBelow = spaceBelow >= contentSize.height;

  const preferredPlacement =
    placement === "auto" ? (spaceBelow >= spaceAbove ? "bottom" : "top") : placement;

  const actualPlacement =
    preferredPlacement === "top"
      ? canFitAbove || !canFitBelow
        ? "top"
        : "bottom"
      : canFitBelow || !canFitAbove
        ? "bottom"
        : "top";

  const preferredTop =
    actualPlacement === "top"
      ? target.y - offset - contentSize.height
      : target.y + target.height + offset;
  const maximumTop = Math.max(topBoundary, bottomBoundary - contentSize.height);

  return {
    left,
    top: clamp(preferredTop, topBoundary, maximumTop),
    placement: actualPlacement,
  };
}

export function SpotlightContainer({
  children,
  placement = "auto",
  offset = 12,
  edgePadding = 16,
  onLayout,
  style,
  pointerEvents,
  ...props
}: SpotlightContainerProps) {
  const { target } = useSpotlight();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [contentSize, setContentSize] = useState<ContentSize | null>(null);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;

      setContentSize((current) =>
        current?.width === width && current.height === height ? current : { width, height },
      );
      onLayout?.(event);
    },
    [onLayout],
  );

  const position = useMemo(() => {
    if (!target || !contentSize) return null;

    return calculateSpotlightContainerPosition({
      target,
      contentSize,
      screenWidth,
      screenHeight,
      topInset: insets.top,
      bottomInset: insets.bottom,
      placement,
      offset,
      edgePadding,
    });
  }, [
    contentSize,
    edgePadding,
    insets.bottom,
    insets.top,
    offset,
    placement,
    screenHeight,
    screenWidth,
    target,
  ]);

  useEffect(() => {
    if (!position) {
      opacity.set(0);
      return;
    }

    const transition = reducedMotion ? { duration: 0 } : SPOTLIGHT_TRANSITION;

    translateX.set(withTiming(position.left, transition));
    translateY.set(withTiming(position.top, transition));
    opacity.set(withTiming(1, { ...transition, duration: reducedMotion ? 0 : 180 }));
  }, [opacity, position, reducedMotion, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }],
    opacity: opacity.get(),
  }));

  if (!target) return null;

  return (
    <Animated.View
      {...props}
      collapsable={false}
      pointerEvents={pointerEvents ?? "box-none"}
      onLayout={handleLayout}
      style={[style, styles.container, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: "absolute",
    top: 0,
    zIndex: 2,
  },
});
