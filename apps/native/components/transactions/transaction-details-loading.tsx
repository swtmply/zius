import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Separator, Skeleton, Typography } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";

export function TransactionDetailsLoading() {
  const router = useRouter();
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/home"));

  return (
    <View
      className="gap-4"
      accessibilityLabel="Loading transaction details"
      accessibilityState={{ busy: true }}
    >
      <View className="flex-row items-center justify-between py-4">
        <Button isIconOnly variant="ghost" accessibilityLabel="Go back" onPress={goBack}>
          <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
        </Button>
        <Skeleton className="h-7 w-40 rounded-md" />
        <Skeleton className="size-12 rounded-full" />
      </View>

      <Card className="shadow-lg border border-border">
        <Card.Body className="gap-4">
          <View className="flex-row items-center justify-between px-4">
            <View className="flex-1 items-center gap-1">
              <Typography className="text-sm text-muted">Total Amount</Typography>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </View>
            <View className="flex-1 items-center gap-1">
              <Typography className="text-sm text-muted">Amount owed</Typography>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </View>
          </View>

          <Separator className="border-t-2 border-dashed border-border bg-transparent" />

          <View className="flex-row items-center">
            {["payer", "split", "group", "settle"].map((item) => (
              <View key={item} className="flex-1 items-center gap-1">
                <Skeleton className="size-12 rounded-full" />
                <Skeleton className="h-3 w-16 rounded-sm" />
              </View>
            ))}
          </View>
        </Card.Body>
      </Card>

      <Typography className="text-sm">Participants</Typography>

      <View className="gap-4">
        {["one", "two", "three"].map((item) => (
          <View key={item} className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-sm" />
            </View>
            <Skeleton className="h-4 w-16 rounded-sm" />
          </View>
        ))}
      </View>
    </View>
  );
}
