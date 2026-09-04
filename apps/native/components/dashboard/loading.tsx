import { View, FlatList } from "react-native";
import React from "react";
import { Button, Card, cn, Separator, Skeleton, Typography } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Add,
  MoreHorizontal,
  TransactionHistoryIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { SectionHeader } from "../section-header";

export default function DashboardLoading() {
  return (
    <View className="bg-background flex-1">
      <FlatList
        ListHeaderComponent={
          <View className="pt-safe gap-4">
            <View className="pt-8 flex-row justify-between items-center">
              <Typography className="text-2xl font-semibold">Dashboard</Typography>

              <Skeleton className="size-12 rounded-full" />
            </View>

            <Card className="shadow-lg border border-border">
              <Card.Body className="gap-4">
                <View className="items-center justify-between flex-row px-4">
                  <View className="items-center justify-center flex-1 gap-1">
                    <Typography className="text-sm text-muted">Utang sayo</Typography>
                    <Skeleton className="w-24 h-8 rounded-lg" />
                  </View>
                  <View className="items-center justify-center flex-1 gap-1">
                    <Typography className="text-sm text-muted">Utang mo</Typography>
                    <Skeleton className="w-24 h-8 rounded-lg" />
                  </View>
                </View>
                <Separator className="border-t-2 border-dashed border-border bg-transparent" />
                <View className="items-center flex-row">
                  <View className="items-center flex-1 gap-1">
                    <Button variant="secondary" isIconOnly>
                      <HugeiconsIcon icon={Add} size={24} />
                    </Button>
                    <Typography className="text-xs text-muted">Transaction</Typography>
                  </View>
                  <View className="items-center flex-1 gap-1">
                    <Button variant="secondary" isIconOnly>
                      <HugeiconsIcon icon={UserGroup03Icon} size={24} />
                    </Button>
                    <Typography className="text-xs text-muted">Groups</Typography>
                  </View>
                  <View className="items-center flex-1 gap-1">
                    <Button variant="secondary" isIconOnly>
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

            <View className="gap-2">
              <SectionHeader
                title="Active Transactions"
                action={
                  <Button variant="ghost">
                    <Typography className="text-sm">See All</Typography>
                  </Button>
                }
              />

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={<View className="w-4" />}
                data={[1, 2, 3, 4, 5]}
                keyExtractor={(item) => item.toString()}
                renderItem={() => (
                  <View className="bg-surface border border-border rounded-xl p-4 w-[250px] gap-2">
                    <View className="flex-row items-center justify-between gap-2">
                      <View className="flex-1 gap-1">
                        <Skeleton className="h-5 w-20 rounded-sm" />
                        <Skeleton className="h-4 w-20 rounded-sm" />
                      </View>
                      <Skeleton className="h-5 w-20 rounded-sm" />
                    </View>

                    <Separator className="border-t border-dashed border-border bg-transparent" />

                    <View className="flex-row items-center">
                      {["A", "B", "C", "D", "E"].map((participant, index) => (
                        <Skeleton
                          key={participant}
                          className={
                            index === 0 ? "size-10 rounded-full" : "size-10 rounded-full -ml-4"
                          }
                        />
                      ))}
                    </View>
                  </View>
                )}
              />
            </View>

            <SectionHeader
              title="Recent Transactions"
              action={
                <Button variant="ghost">
                  <Typography className="text-sm">See All</Typography>
                </Button>
              }
            />
          </View>
        }
        contentContainerClassName="px-4 pb-8"
        data={[1, 2, 3, 4, 5]}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item, index }) => (
          <View
            className={cn(
              "flex-row items-center justify-between gap-2 py-2 border-border",
              5 === index + 1 ? "" : "border-b",
            )}
            key={item}
          >
            <View className="flex-1 gap-1">
              <Skeleton className="h-5 w-20 rounded-sm" />
              <Skeleton className="h-4 w-20 rounded-sm" />
            </View>
            <Skeleton className="h-5 w-20 rounded-sm" />
          </View>
        )}
      />
    </View>
  );
}
