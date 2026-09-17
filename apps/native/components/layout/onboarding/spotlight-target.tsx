import { useCallback, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";

import { useSpotlight } from "./spotlight-provider";

type SpotlightTargetProps = ViewProps & {
  id: string;
  children: ReactNode;
};

export function SpotlightTarget({ id, children, ...props }: SpotlightTargetProps) {
  const { registerTarget } = useSpotlight();

  const ref = useCallback(
    (node: View | null) => {
      registerTarget(id, node);
    },
    [id, registerTarget],
  );

  return (
    <View ref={ref} collapsable={false} {...props}>
      {children}
    </View>
  );
}
