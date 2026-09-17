import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";

import type { SpotlightRect } from "./spotlight-overlay";

type SpotlightTargetId = string;

type SpotlightContextValue = {
  target: SpotlightRect | null;
  activeTargetId: SpotlightTargetId | null;

  registerTarget: (id: SpotlightTargetId, node: View | null) => void;

  focusTarget: (id: SpotlightTargetId, padding?: number) => Promise<void>;
};

const SpotlightContext = createContext<SpotlightContextValue | null>(null);

type SpotlightState = {
  id: SpotlightTargetId;
  rect: SpotlightRect;
};

export function SpotlightProvider({ children }: { children: ReactNode }) {
  const targets = useRef(new Map<SpotlightTargetId, View>());

  const [spotlight, setSpotlight] = useState<SpotlightState | null>(null);

  const registerTarget = useCallback((id: SpotlightTargetId, node: View | null) => {
    if (node) {
      targets.current.set(id, node);
      return;
    }

    targets.current.delete(id);
  }, []);

  const focusTarget = useCallback(async (id: SpotlightTargetId, padding = 8) => {
    const node = targets.current.get(id);

    if (!node) {
      console.warn(`Spotlight target "${id}" is not registered`);

      return;
    }

    await new Promise<void>((resolve) => {
      node.measureInWindow((x, y, width, height) => {
        if (width === 0 || height === 0) {
          resolve();
          return;
        }

        setSpotlight({
          id,
          rect: {
            x: x - padding,
            y: y - padding,
            width: width + padding * 2,
            height: height + padding * 2,
          },
        });

        resolve();
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      target: spotlight?.rect ?? null,
      activeTargetId: spotlight?.id ?? null,
      registerTarget,
      focusTarget,
    }),
    [spotlight, registerTarget, focusTarget],
  );

  return <SpotlightContext.Provider value={value}>{children}</SpotlightContext.Provider>;
}

export function useSpotlight() {
  const context = useContext(SpotlightContext);

  if (!context) {
    throw new Error("useSpotlight must be used inside SpotlightProvider");
  }

  return context;
}
