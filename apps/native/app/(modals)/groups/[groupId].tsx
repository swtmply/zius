import { useState } from "react";
import { FlatList, Keyboard, Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Skeleton, Typography, useToast } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Check, ChevronLeftFreeIcons, Edit02Icon, Trash } from "@hugeicons/core-free-icons";
import { trpc } from "@/utils/trpc";
import { BillCreationToast } from "@/components/bill-creation-toast";
import { GroupParticipants, GroupTransactionCard } from "@/components/groups/group-details";
import {
  GroupParticipantsLoading,
  GroupTransactionsLoading,
} from "@/components/groups/group-details-loading";

export default function GroupDetailsPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [folded, setFolded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const query = useQuery(trpc.group.get.queryOptions({ id: groupId }));
  const group = query.data;
  const updateGroup = useMutation(
    trpc.group.update.mutationOptions({
      onSuccess: async (updated) => {
        const queryKey = trpc.group.get.queryKey({ id: updated.id });
        await queryClient.cancelQueries({ queryKey });
        queryClient.setQueryData(queryKey, (current) =>
          current ? { ...current, name: updated.name } : current,
        );
        setIsEditing(false);
        Keyboard.dismiss();
        toast.show({
          component: (props) => (
            <BillCreationToast
              {...props}
              variant="success"
              title="Group renamed"
              description="Your group name has been updated."
            />
          ),
        });
        void queryClient.invalidateQueries({ queryKey: trpc.group.list.pathKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.bill.get.pathKey() });
      },
      onError: (error) => {
        toast.show({
          duration: 6000,
          component: (props) => (
            <BillCreationToast
              {...props}
              variant="danger"
              title="Failed to rename group"
              description={error.message.trim() || "Please try again."}
            />
          ),
        });
      },
    }),
  );

  const submit = () => {
    if (!group || !isEditing || updateGroup.isPending) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.show({
        component: (props) => (
          <BillCreationToast
            {...props}
            variant="danger"
            title="Enter a group name"
            description="Add a name before saving the group."
          />
        ),
      });
      return;
    }
    updateGroup.mutate({ id: groupId, name: trimmedName });
  };

  return (
    <View className="flex-1 bg-background">
      <FlatList
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pt-safe pb-safe-offset-8"
        data={group?.transactions ?? []}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={<View className="h-4" />}
        refreshing={query.isRefetching}
        onRefresh={() => {
          void query.refetch();
        }}
        ListHeaderComponent={
          <View className="gap-4 pb-4">
            <View className="flex-row items-center justify-between py-4 gap-4">
              <Button
                isIconOnly
                variant="ghost"
                isDisabled={isEditing}
                accessibilityLabel={isEditing ? "Delete group unavailable" : "Go back"}
                accessibilityHint={isEditing ? "Group deletion is not supported yet" : undefined}
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/groups"))}
              >
                <HugeiconsIcon icon={isEditing ? Trash : ChevronLeftFreeIcons} size={24} />
              </Button>
              {query.isPending ? (
                <Skeleton className="h-8 w-32 rounded-md" />
              ) : isEditing ? (
                <TextInput
                  autoFocus
                  selectTextOnFocus
                  accessibilityLabel="Group name"
                  value={name}
                  onChangeText={setName}
                  editable={!updateGroup.isPending}
                  onSubmitEditing={submit}
                  returnKeyType="done"
                  className="text-2xl font-semibold flex-1 text-center text-foreground"
                />
              ) : (
                <Typography className="text-2xl font-semibold flex-1 text-center" numberOfLines={2}>
                  {group?.name ?? "Group"}
                </Typography>
              )}
              <Button
                isIconOnly
                variant="ghost"
                isDisabled={!group || updateGroup.isPending}
                accessibilityLabel={isEditing ? "Save group name" : "Edit group name"}
                accessibilityState={{ busy: updateGroup.isPending }}
                onPress={() => {
                  if (isEditing) {
                    submit();
                  } else if (group) {
                    setName(group.name);
                    setIsEditing(true);
                  }
                }}
              >
                <HugeiconsIcon icon={isEditing ? Check : Edit02Icon} size={24} />
              </Button>
            </View>
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                isDisabled={updateGroup.isPending}
                onPress={() => {
                  setIsEditing(false);
                  Keyboard.dismiss();
                }}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
            )}
            {(query.isPending || group) && (
              <>
                <View className="flex-row items-center justify-between">
                  <Typography className="text-sm">Participants</Typography>
                  <Pressable
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={folded ? "Expand participants" : "Fold participants"}
                    accessibilityState={{ expanded: !folded }}
                    onPress={() => setFolded((value) => !value)}
                  >
                    <Typography className="text-xs text-muted">
                      {folded ? "Expand" : "Fold"}
                    </Typography>
                  </Pressable>
                </View>
                {group ? (
                  <GroupParticipants participants={group.participants} folded={folded} />
                ) : (
                  <GroupParticipantsLoading folded={folded} />
                )}
                <View className="flex-row items-center justify-between gap-4">
                  <Typography className="text-sm">Transactions</Typography>
                  <Pressable
                    disabled={!group}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !group }}
                    onPress={() =>
                      router.push({ pathname: "/create-transaction", params: { groupId } })
                    }
                  >
                    <Typography className="text-xs text-muted">Create Transaction</Typography>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <GroupTransactionsLoading />
          ) : group && !query.isError ? (
            <Typography className="text-center text-xs text-muted py-8">
              No transactions yet.
            </Typography>
          ) : null
        }
        ListFooterComponent={
          query.isError ? (
            <View className="items-center gap-4 py-6">
              <Typography selectable className="text-xs text-muted">
                {query.error.data?.code === "NOT_FOUND"
                  ? "Group not found."
                  : "Unable to load group details."}
              </Typography>
              <Button
                variant="secondary"
                size="sm"
                onPress={() => {
                  void query.refetch();
                }}
              >
                <Button.Label>Try again</Button.Label>
              </Button>
            </View>
          ) : group && group.transactions.length > 0 ? (
            <Typography className="text-center text-xs text-muted py-4">No more.</Typography>
          ) : null
        }
        renderItem={({ item }) => <GroupTransactionCard transaction={item} />}
      />
    </View>
  );
}
