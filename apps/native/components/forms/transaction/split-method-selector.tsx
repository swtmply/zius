import { Button } from "heroui-native";
import { View } from "react-native";

import { splitMethods, type SplitMethod } from "./transaction-form-model";

type SplitMethodSelectorProps = {
  value: SplitMethod;
  onChange: (method: SplitMethod) => void;
};

export function SplitMethodSelector({ value, onChange }: SplitMethodSelectorProps) {
  return (
    <View className="flex-row items-center gap-1">
      {splitMethods.map((method) => (
        <Button
          key={method}
          size="sm"
          variant={method === value ? "primary" : "secondary"}
          onPress={() => onChange(method)}
        >
          <Button.Label className="capitalize">{method}</Button.Label>
        </Button>
      ))}
    </View>
  );
}
