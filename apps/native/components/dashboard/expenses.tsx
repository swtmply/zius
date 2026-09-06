import { ActiveExpense } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/utils";
import { Avatar, Button, PressableFeedback, Separator, Typography } from "heroui-native";
import { View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { SectionHeader } from "../section-header";
import { useRouter } from "expo-router";

export function ExpensesEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View className="bg-surface border border-border rounded-xl px-6 py-8 gap-1 items-center">
      <Typography className="text-sm font-semibold text-center">{title}</Typography>
      <Typography className="text-xs text-muted text-center">{description}</Typography>
    </View>
  );
}

export function ActiveExpenses({ expenses }: { expenses: ActiveExpense[] }) {
  const router = useRouter();

  return (
    <View className="gap-2">
      <SectionHeader
        title="Active Expenses"
        action={
          (expenses.length ?? 0) > 0 ? (
            <Button
              variant="ghost"
              onPress={() =>
                router.push({
                  pathname: "/(modals)/expenses",
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

      {expenses.length === 0 ? (
        <ExpensesEmptyState
          title="No active expenses"
          description="Expenses with outstanding payments will appear here."
        />
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={<View className="w-4" />}
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PressableFeedback
              onPress={() =>
                router.push({
                  pathname: `/(modals)/expenses/[expenseId]`,
                  params: {
                    expenseId: item.id,
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
