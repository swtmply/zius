import { useState } from "react";
import { Keyboard, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BottomSheet, Button, Menu, Skeleton, Typography, useToast } from "heroui-native";
import {
  Archive02Icon,
  Check,
  ChevronLeftFreeIcons,
  Delete02Icon,
  Edit02Icon,
  MoreHorizontalIcon,
  RestoreBinIcon,
  XIcon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { trpc } from "@/utils/trpc";
import { ExpenseCreationToast } from "@/components/layout/expense-creation-toast";
import { GroupExpensesSection, GroupParticipants } from "@/components/groups/group-details";
import {
  GroupParticipantsLoading,
  GroupExpensesSectionLoading,
} from "@/components/groups/skeletons/group-details-skeleton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GroupDetailsPage() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const insets = useSafeAreaInsets();
  const [folded, setFolded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const query = useQuery(trpc.group.get.queryOptions({ id: groupId }));
  const currentParticipantQuery = useQuery(trpc.participant.current.queryOptions());
  const group = query.data;
  const currentParticipant = currentParticipantQuery.data;
  const unsettledExpenses = group?.expenses.filter((expense) => expense.status === "active") ?? [];
  const settledExpenses = group?.expenses.filter((expense) => expense.status !== "active") ?? [];
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

  const editingNameWidth = Math.min(Math.max(name.length * 14 + 32, 112), 220);

  return (
    <View className="flex-1 bg-page">
      <ScrollView
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-4 px-4 pt-safe pb-safe-offset-8"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => {
              void query.refetch();
            }}
          />
        }
      >
        <View className="gap-4">
          <View className="flex-row items-center justify-between gap-4 py-4">
            <Button
              isIconOnly
              variant="ghost"
              isDisabled={isEditing && updateGroup.isPending}
              accessibilityLabel={isEditing ? "Cancel editing group name" : "Go back"}
              onPress={() => {
                if (isEditing) {
                  setIsEditing(false);
                  Keyboard.dismiss();
                } else if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/groups");
                }
              }}
            >
              <Icon
                icon={isEditing ? XIcon : ChevronLeftFreeIcons}
                size={24}
                colorClassName="accent-ink"
              />
            </Button>
            <View className="flex-1 items-center">
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
                  textAlignVertical="center"
                  className="h-10 max-w-full rounded-lg border border-border px-2 py-0 text-center text-2xl font-semibold text-ink"
                  style={{
                    width: editingNameWidth,
                    includeFontPadding: false,
                  }}
                />
              ) : (
                <Typography
                  selectable
                  className="text-center text-2xl font-semibold text-ink"
                  numberOfLines={2}
                >
                  {group?.name ?? "Group"}
                </Typography>
              )}
            </View>
            {group && canRename && isEditing ? (
              <Button
                isIconOnly
                variant="ghost"
                isDisabled={updateGroup.isPending || archiveActionPending}
                accessibilityLabel="Save group name"
                accessibilityState={{ busy: updateGroup.isPending }}
                onPress={submit}
              >
                <Icon icon={Check} size={24} colorClassName="accent-ink" />
              </Button>
            ) : group && canManageArchive && !isArchived ? (
              <Menu>
                <Menu.Trigger asChild isDisabled={updateGroup.isPending || archiveActionPending}>
                  <Button
                    isIconOnly
                    variant="ghost"
                    isDisabled={updateGroup.isPending || archiveActionPending}
                    accessibilityLabel="Group actions"
                    accessibilityState={{
                      disabled: updateGroup.isPending || archiveActionPending,
                    }}
                  >
                    <Icon icon={MoreHorizontalIcon} size={24} colorClassName="accent-ink" />
                  </Button>
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Overlay />
                  <Menu.Content presentation="popover" width={120} className="p-2">
                    <Menu.Item
                      className="gap-2 rounded-xl px-2 py-1.5"
                      isDisabled={updateGroup.isPending || archiveActionPending}
                      onPress={() => {
                        setName(group.name);
                        setIsEditing(true);
                      }}
                    >
                      <Icon icon={Edit02Icon} size={18} colorClassName="accent-ink" />
                      <Menu.ItemTitle className="text-sm font-normal">Edit</Menu.ItemTitle>
                    </Menu.Item>
                    <Menu.Item className="gap-2 rounded-xl px-2 py-1.5" isDisabled variant="danger">
                      <Icon icon={Delete02Icon} size={18} color="#FF3B30" />
                      <Menu.ItemTitle className="text-sm font-normal">Delete</Menu.ItemTitle>
                    </Menu.Item>
                    <Menu.Item
                      className="gap-2 rounded-xl px-2 py-1.5"
                      isDisabled={archiveActionPending}
                      variant="danger"
                      onPress={() => setIsArchiveDialogOpen(true)}
                    >
                      <Icon icon={Archive02Icon} size={18} color="#FF3B30" />
                      <Menu.ItemTitle className="text-sm font-normal">Archive</Menu.ItemTitle>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Portal>
              </Menu>
            ) : group && canManageArchive && isArchived ? (
              <Button
                isIconOnly
                variant="ghost"
                isDisabled={archiveActionPending}
                accessibilityLabel="Restore group"
                accessibilityState={{ busy: archiveActionPending }}
                onPress={() => setIsArchiveDialogOpen(true)}
              >
                <Icon icon={RestoreBinIcon} size={24} colorClassName="accent-ink" />
              </Button>
            ) : (
              <View className="size-12" />
            )}
          </View>

          {group && isArchived ? (
            <View
              className="gap-1 rounded-2xl border border-border bg-default px-4 py-3"
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

          {(query.isPending || group) && (
            <>
              <View className="gap-2">
                <View className="flex-row items-center justify-between gap-4">
                  <Typography className="text-sm text-ink">Participants</Typography>
                  <Pressable
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={
                      folded ? "Show participant names" : "Hide participant names"
                    }
                    accessibilityState={{ expanded: !folded }}
                    onPress={() => setFolded((value) => !value)}
                  >
                    <Typography className="text-xs text-supporting">
                      {folded ? "Show Names" : "Hide Names"}
                    </Typography>
                  </Pressable>
                </View>
                {group ? (
                  <GroupParticipants participants={group.participants} folded={folded} />
                ) : (
                  <GroupParticipantsLoading folded={folded} />
                )}
              </View>

              {query.isPending ? (
                <>
                  <GroupExpensesSectionLoading title="Unsettled Expenses" showAction />
                  <GroupExpensesSectionLoading title="Settled Expenses" />
                </>
              ) : group ? (
                <>
                  <GroupExpensesSection
                    title="Unsettled Expenses"
                    emptyMessage="No unsettled expenses."
                    expenses={unsettledExpenses}
                    onAddExpense={
                      isArchived
                        ? undefined
                        : () => router.push({ pathname: "/expenses/create", params: { groupId } })
                    }
                  />
                  <GroupExpensesSection
                    title="Settled Expenses"
                    emptyMessage="No settled expenses."
                    expenses={settledExpenses}
                  />
                </>
              ) : null}
            </>
          )}

          {query.isError ? (
            <View className="items-center gap-4 py-6">
              <Typography selectable className="text-xs text-supporting">
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
          ) : null}
        </View>
      </ScrollView>
      <BottomSheet
        isOpen={isArchiveDialogOpen}
        onOpenChange={(isOpen) => {
          if (!archiveActionPending) setIsArchiveDialogOpen(isOpen);
        }}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            detached
            bottomInset={insets.bottom + 12}
            className="mx-4 overflow-hidden"
            backgroundClassName="rounded-3xl"
            contentContainerClassName="p-5"
            enableDynamicSizing
            handleComponent={null}
          >
            <View className="mb-5 gap-1">
              <BottomSheet.Title>
                {isArchived ? "Restore group?" : "Archive group?"}
              </BottomSheet.Title>
              <BottomSheet.Description>
                {isArchived
                  ? "This group will appear in your active groups again."
                  : "This hides the group from active lists. Existing debts remain, and payments or expense cancellation stay available. You can restore the group later."}
              </BottomSheet.Description>
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
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  );
}
