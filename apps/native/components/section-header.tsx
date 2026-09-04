import { Typography } from "heroui-native";
import { View } from "react-native";

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export const SectionHeader = ({ title, action }: SectionHeaderProps) => {
  return (
    <View className="flex-row justify-between items-center">
      <Typography className="text-sm tracking-tight">{title}</Typography>
      {action}
    </View>
  );
};
