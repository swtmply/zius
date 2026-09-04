import { View } from "react-native";
import React from "react";
import { Card, Typography, Separator, Button } from "heroui-native";
import { formatCurrency } from "@/utils";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Add,
  MoreHorizontal,
  TransactionHistoryIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";

interface BalanceCardProps {
  owedToYouMinor: number;
  youOweMinor: number;
}

export default function BalanceCard({ owedToYouMinor, youOweMinor }: BalanceCardProps) {
  const router = useRouter();

  return (
    <Card className="shadow-lg border border-border">
      <Card.Body className="gap-4">
        <View className="items-center justify-between flex-row px-4">
          <View className="items-center justify-center flex-1 gap-1">
            <Typography className="text-sm text-muted">Utang sayo</Typography>
            <Typography className="text-2xl font-semibold">
              {formatCurrency(owedToYouMinor)}
            </Typography>
          </View>
          <View className="items-center justify-center flex-1 gap-1">
            <Typography className="text-sm text-muted">Utang mo</Typography>
            <Typography className="text-2xl font-semibold">
              {formatCurrency(youOweMinor)}
            </Typography>
          </View>
        </View>
        <Separator className="border-t-2 border-dashed border-border bg-transparent" />
        <View className="items-center flex-row">
          <View className="items-center flex-1 gap-1">
            <Button
              variant="secondary"
              isIconOnly
              onPress={() => router.push("/create-transaction")}
            >
              <HugeiconsIcon icon={Add} size={24} />
            </Button>
            <Typography className="text-xs text-muted">Transaction</Typography>
          </View>
          <View className="items-center flex-1 gap-1">
            <Button
              variant="secondary"
              isIconOnly
              accessibilityLabel="View groups"
              onPress={() =>
                router.push({
                  pathname: "/(modals)/groups",
                  params: {
                    sort: "desc",
                    type: "all",
                  },
                })
              }
            >
              <HugeiconsIcon icon={UserGroup03Icon} size={24} />
            </Button>
            <Typography className="text-xs text-muted">Groups</Typography>
          </View>
          <View className="items-center flex-1 gap-1">
            <Button
              variant="secondary"
              isIconOnly
              onPress={() =>
                router.push({
                  pathname: "/(modals)/transactions",
                  params: {
                    sort: "desc",
                    type: "all",
                  },
                })
              }
            >
              <HugeiconsIcon icon={TransactionHistoryIcon} size={24} />
            </Button>
            <Typography className="text-xs text-muted">History</Typography>
          </View>
          <View className="items-center flex-1 gap-1">
            <Button variant="secondary" isIconOnly>
              <HugeiconsIcon icon={MoreHorizontal} size={24} />
            </Button>
            <Typography className="text-xs text-muted">More</Typography>
          </View>
        </View>
      </Card.Body>
    </Card>
  );
}
