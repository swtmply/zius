import { useState } from "react";
import { FlatList, Keyboard, Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Skeleton, Typography, useToast } from "heroui-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Check, ChevronLeftFreeIcons, Edit02Icon } from "@hugeicons/core-free-icons";
import { trpc } from "@/utils/trpc";
import { ExpenseCreationToast } from "@/components/expense-creation-toast";
import { GroupParticipants, GroupExpenseCard } from "@/components/groups/group-details";
import {
  GroupParticipantsLoading,
  GroupExpensesLoading,
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
  const currentParticipantQuery = useQuery(trpc.participant.current.queryOptions());
  const group = query.data;
  const currentParticipant = currentParticipantQuery.data;
  const isOwner =
    !!group &&
    !!currentParticipant &&
    group.participants.find((participant) => participant.id === currentParticipant.id)?.role ===
      "owner";
  const isArchived = !!group?.archivedAt;
  const canRename = isOwner && !isArchived;
  const canManageArchive = isOwner;
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
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
            <ExpenseCreationToast
              {...props}
              variant="success"
              title="Group renamed"
              description="Your group name has been updated."
            />
          ),
        });
        void queryClient.invalidateQueries({ queryKey: trpc.group.pathKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.expense.pathKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() });
      },
      onError: (error) => {
        toast.show({
          duration: 6000,
          component: (props) => (
            <ExpenseCreationToast
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

  const archiveGroup = useMutation(trpc.group.archive.mutationOptions());
  const restoreGroup = useMutation(trpc.group.restore.mutationOptions());
  const archiveActionPending = archiveGroup.isPending || restoreGroup.isPending;

  const invalidateGroupState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.group.get.queryKey({ id: groupId }) }),
      queryClient.invalidateQueries({ queryKey: trpc.group.list.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.expense.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.dashboard.pathKey() }),
    ]);
  };

  const submitArchiveAction = async () => {
    if (!group || !canManageArchive || archiveActionPending) return;

    try {
      if (isArchived) {
        await restoreGroup.mutateAsync({ id: group.id });
      } else {
        await archiveGroup.mutateAsync({ id: group.id });
      }
      await invalidateGroupState();
      setIsArchiveDialogOpen(false);
      setIsEditing(false);
      Keyboard.dismiss();
      toast.show({
        component: (props) => (
          <ExpenseCreationToast
            {...props}
            variant="success"
            title={isArchived ? "Group restored" : "Group archived"}
            description={
              isArchived
                ? "This group is back in your active groups."
                : "This group is hidden from your active groups."
            }
          />
        ),
      });
    } catch (error) {
      toast.show({
        duration: 6000,
        component: (props) => (
          <ExpenseCreationToast
            {...props}
            variant="danger"
            title={isArchived ? "Failed to restore group" : "Failed to archive group"}
            description={
              error instanceof Error && error.message.trim()
                ? error.message
                : "Something went wrong. Please try again."
            }
          />
        ),
      });
    }
  };

  const submit = () => {
    if (!group || !isEditing || !canRename || updateGroup.isPending) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.show({
        component: (props) => (
          <ExpenseCreationToast
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
        data={group?.expenses ?? []}
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
                accessibilityLabel="Go back"
                onPress={() => (router.canGoBack() ? router.back() : router.replace("/groups"))}
              >
                <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
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
              {group && canRename ? (
                <Button
                  isIconOnly
                  variant="ghost"
                  isDisabled={updateGroup.isPending || archiveActionPending}
                  accessibilityLabel={isEditing ? "Save group name" : "Edit group name"}
                  accessibilityState={{ busy: updateGroup.isPending }}
                  onPress={() => {
                    if (isEditing) {
                      submit();
                    } else {
                      setName(group.name);
                      setIsEditing(true);
                    }
                  }}
                >
                  <HugeiconsIcon icon={isEditing ? Check : Edit02Icon} size={24} />
                </Button>
              ) : (
                <View className="size-10" />
              )}
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
            {group && isArchived ? (
              <View
                className="bg-default border border-border rounded-xl px-4 py-3 gap-1"
                accessible
                accessibilityLabel="Archived group. New expenses and name changes are disabled. Existing payments and expense cancellation remain available."
              >
                <Typography className="text-sm font-semibold text-muted">Archived group</Typography>
                <Typography className="text-xs text-muted">
                  New expenses and name changes are disabled. Existing payments and expense
                  cancellation remain available.
                </Typography>
              </View>
            ) : null}
            {group && canManageArchive ? (
              <Button
                className="w-full"
                variant={isArchived ? "secondary" : "danger-soft"}
                isDisabled={archiveActionPending || isEditing}
                accessibilityLabel={isArchived ? "Restore group" : "Archive group"}
                accessibilityState={{ busy: archiveActionPending }}
                onPress={() => setIsArchiveDialogOpen(true)}
              >
                <Button.Label>{isArchived ? "Restore group" : "Archive group"}</Button.Label>
              </Button>
            ) : null}
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
                  <Typography className="text-sm">Expenses</Typography>
                  {group?.archivedAt ? null : (
                    <Pressable
                      disabled={!group}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel="Create expense"
                      accessibilityState={{ disabled: !group }}
                      onPress={() =>
                        router.push({ pathname: "/create-expense", params: { groupId } })
                      }
                    >
                      <Typography className="text-xs text-muted">Create Expense</Typography>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          query.isPending ? (
            <GroupExpensesLoading />
          ) : group && !query.isError ? (
            <Typography className="text-center text-xs text-muted py-8">
              No expenses yet.
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
          ) : group && group.expenses.length > 0 ? (
            <Typography className="text-center text-xs text-muted py-4">No more.</Typography>
          ) : null
        }
        renderItem={({ item }) => <GroupExpenseCard expense={item} />}
      />
      <Dialog
        isOpen={isArchiveDialogOpen}
        onOpenChange={(isOpen) => {
          if (!archiveActionPending) setIsArchiveDialogOpen(isOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <View className="mb-5 gap-1">
              <Dialog.Title>{isArchived ? "Restore group?" : "Archive group?"}</Dialog.Title>
              <Dialog.Description>
                {isArchived
                  ? "This group will appear in your active groups again."
                  : "This hides the group from active lists. Existing debts remain, and payments or expense cancellation stay available. You can restore the group later."}
              </Dialog.Description>
            </View>
            <View className="gap-1">
              <Button
                variant={isArchived ? "primary" : "danger"}
                isDisabled={archiveActionPending}
                accessibilityState={{ busy: archiveActionPending }}
                onPress={() => void submitArchiveAction()}
              >
                <Button.Label>
                  {archiveActionPending
                    ? isArchived
                      ? "Restoring..."
                      : "Archiving..."
                    : isArchived
                      ? "Restore group"
                      : "Archive group"}
                </Button.Label>
              </Button>
              <Button
                variant="ghost"
                isDisabled={archiveActionPending}
                onPress={() => setIsArchiveDialogOpen(false)}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  );
}
