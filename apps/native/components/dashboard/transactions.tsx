import { ActiveTransaction } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/utils";
import { Avatar, Button, PressableFeedback, Separator, Typography } from "heroui-native";
import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SectionHeader } from "../section-header";
import { useRouter } from "expo-router";

export function TransactionsEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="bg-surface border border-border rounded-xl px-6 py-8 gap-1 items-center">
      <Typography className="text-sm font-semibold text-center">{title}</Typography>
      <Typography className="text-xs text-muted text-center">{description}</Typography>
    </View>
  );
}

export function ActiveTransactions({ transactions }: { transactions: ActiveTransaction[] }) {
  const router = useRouter();

  return (
    <View className="gap-2">
      <SectionHeader
        title="Active Transactions"
        action={
          (transactions.length ?? 0) > 0 ? (
            <Button
              variant="ghost"
              onPress={() =>
                router.push({
                  pathname: "/(modals)/transactions",
                  params: {
                    sort: "desc",
                    type: "active",
                  },
                })
              }
            >
              <Typography className="text-sm text-muted">See All</Typography>
            </Button>
          ) : null
        }
      />

      {transactions.length === 0 ? (
        <TransactionsEmptyState
          title="No active transactions"
          description="Transactions with outstanding payments will appear here."
        />
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={<View className="w-4" />}
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PressableFeedback
              onPress={() =>
                router.push({
                  pathname: `/(modals)/transactions/[transactionId]`,
                  params: {
                    transactionId: item.id,
                  },
                })
              }
            >
              <View className="bg-surface border border-border rounded-xl p-4 w-[250px] gap-2">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1 gap-1">
                    <Typography className="text-sm">{item.title}</Typography>
                    <Typography className="text-xs text-muted">
                      {formatDate(new Date(item.occurredAt))}
                    </Typography>
                  </View>
                  <Typography className="text-sm font-semibold">
                    {formatCurrency(item.totalMinor)}
                  </Typography>
                </View>

                <Separator className="border-t border-dashed border-border bg-transparent" />

                <View className="flex-row items-center">
                  {item.participants.map((participant, index) => (
                    <Avatar
                      key={participant.id}
                      className={index === 0 ? undefined : "-ml-4"}
                      size="sm"
                    >
                      <Avatar.Fallback>
                        <Typography className="text-sm">{participant.name[0]}</Typography>
                      </Avatar.Fallback>
                    </Avatar>
                  ))}
                </View>
              </View>
            </PressableFeedback>
          )}
        />
      )}
    </View>
  );
}
