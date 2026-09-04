import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { Avatar, Typography } from "heroui-native";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";

type Group = inferRouterOutputs<AppRouter>["group"]["get"];
type Person = Pick<Group["participants"][number], "id" | "name" | "image">;

export function GroupAvatar({ person, className }: { person: Person; className?: string }) {
  return (
    <Avatar className={className} size="sm" alt={person.name}>
      {person.image && <Avatar.Image source={{ uri: person.image }} />}
      <Avatar.Fallback>
        <Typography className="text-sm">{person.name.slice(0, 1).toUpperCase()}</Typography>
      </Avatar.Fallback>
    </Avatar>
  );
}

export function GroupParticipants({
  participants,
  folded,
}: {
  participants: Group["participants"];
  folded: boolean;
}) {
  return (
    <View className={folded ? "flex-row flex-wrap items-center justify-start" : "gap-4"}>
      {participants.map((person, index) =>
        folded ? (
          <GroupAvatar
            key={person.id}
            person={person}
            className={index === 0 ? undefined : "-ml-4"}
          />
        ) : (
          <View key={person.id} className="flex-row items-center gap-4">
            <GroupAvatar person={person} />
            <Typography className="text-sm shrink" selectable>
              {person.name}
            </Typography>
            {!person.userId && (
              <View className="bg-default rounded-full px-2 py-0.5">
                <Typography className="text-xs">Guest</Typography>
              </View>
            )}
          </View>
        ),
      )}
    </View>
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

export function GroupTransactionCard({
  transaction,
}: {
  transaction: Group["transactions"][number];
}) {
  const router = useRouter();
  const amount = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: transaction.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(transaction.totalMinor / 100);
  const remaining = transaction.participants.length - 4;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${transaction.title}, ${amount}`}
      onPress={() =>
        router.push({
          pathname: "/transactions/[transactionId]",
          params: { transactionId: transaction.id },
        })
      }
      className="bg-surface border border-border rounded-xl p-4 gap-2 active:opacity-70"
    >
      <View className="gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Typography className="text-sm flex-1">{transaction.title}</Typography>
          <Typography className="text-sm font-semibold" style={{ fontVariant: ["tabular-nums"] }}>
            {amount}
          </Typography>
        </View>
        <Typography className="text-xs text-muted">
          {dateFormatter.format(new Date(transaction.occurredAt))}
        </Typography>
      </View>
      <View className="border-t border-dashed border-border pt-2">
        <View className="flex-row flex-wrap items-center justify-start">
          {transaction.participants.slice(0, 4).map((person, index) => (
            <View
              key={person.id}
              className={
                index === 0
                  ? "rounded-full border border-surface"
                  : "rounded-full border border-surface -ml-4"
              }
            >
              <GroupAvatar person={person} />
            </View>
          ))}
          {remaining > 0 && (
            <View
              className="size-6 rounded-full border border-surface bg-default items-center justify-center -ml-4"
              accessibilityLabel={`${remaining} more participants`}
            >
              <Typography className="text-[10px]">{remaining}+</Typography>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
