import { Typography } from "heroui-native";
import { type ReactNode } from "react";
import { View } from "react-native";

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export const SectionHeader = ({ title, action }: SectionHeaderProps) => {
  return (
    <View className="flex-row items-center justify-between gap-2">
      <Typography className="text-sm tracking-tight">{title}</Typography>
      {action}
    </View>
  );
};
