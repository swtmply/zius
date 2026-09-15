import type { HugeiconsProps } from "@hugeicons/react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Button, Typography } from "heroui-native";
import { View } from "react-native";

import { formatCurrency } from "@/utils";

export type HeaderCardAction = {
  id: string;
  label: string;
  accessibilityLabel: string;
  icon: HugeiconsProps["icon"];
  onPress: () => void;
};

export interface HeaderCardProps {
  owedToYouMinor: number;
  youOweMinor: number;
  actions: readonly HeaderCardAction[];
}

function BalanceMetric({ label, amount }: { label: string; amount: number }) {
  return (
    <View className="flex-1 rounded-2xl bg-dark-gradient p-4 gap-2">
      <Typography className="text-sm text-dark-supporting">{label}</Typography>
      <Typography
        className="text-2xl font-semibold text-on-dark"
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {formatCurrency(amount)}
      </Typography>
    </View>
  );
}

function HeaderCardActionButton({ action }: { action: HeaderCardAction }) {
  return (
    <View className="items-center flex-1 gap-1">
      <Button
        className="bg-page rounded-full"
        variant="secondary"
        isIconOnly
        accessibilityLabel={action.accessibilityLabel}
        onPress={action.onPress}
      >
        <HugeiconsIcon icon={action.icon} size={24} color="#000000" />
      </Button>
      <Typography className="text-xs text-ink">{action.label}</Typography>
    </View>
  );
}

export function DashboardHeaderCard({ owedToYouMinor, youOweMinor, actions }: HeaderCardProps) {
  return (
    <View className="gap-4">
      <View className="flex-row gap-2">
        <BalanceMetric label="You owed" amount={youOweMinor} />
        <BalanceMetric label="You’re owed" amount={owedToYouMinor} />
      </View>

      <View className="rounded-2xl bg-panel p-4">
        <View className="items-center flex-row">
          {actions.map((action) => (
            <HeaderCardActionButton key={action.id} action={action} />
          ))}
        </View>
      </View>
    </View>
  );
}
