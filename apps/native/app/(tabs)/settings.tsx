import { Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, ScrollView, TextInput, View } from "react-native";
import { Typography } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);

  const startEditing = () => {
    setDraftName(user?.name ?? "");
    setErrorMessage(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftName(user?.name ?? "");
    setErrorMessage(null);
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const saveName = async () => {
    if (isSaving || isSigningOut) return;
    const name = draftName.trim();
    if (!name) {
      setErrorMessage("Enter your name before saving.");
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);
    const result = await authClient.updateUser({ name }).catch((error: unknown) => ({
      error: {
        message: error instanceof Error ? error.message : "Unable to update your name.",
      },
    }));
    setIsSaving(false);

    if (result.error) {
      setErrorMessage(result.error.message || "Unable to update your name.");
      return;
    }

    setDraftName(name);
    setIsEditing(false);
    Keyboard.dismiss();
  };

  const signOut = async () => {
    if (isSaving || isSigningOut) return;
    setErrorMessage(null);
    setIsSigningOut(true);
    const result = await authClient.signOut().catch((error: unknown) => ({
      error: {
        message: error instanceof Error ? error.message : "Unable to log out.",
      },
    }));
    setIsSigningOut(false);

    if (result.error) {
      setErrorMessage(result.error.message || "Unable to log out.");
      return;
    }

    queryClient.clear();
  };

  return (
    <View className="flex-1 bg-page">
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom, 24) + 24,
        }}
      >
        <View className="gap-4 px-4">
          <View className="flex-row items-center justify-between gap-4">
            <Typography selectable className="text-2xl font-semibold text-ink">
              Settings
            </Typography>
            <Pressable
              accessibilityLabel={isEditing ? "Save name" : "Edit name"}
              accessibilityRole="button"
              accessibilityState={{ busy: isSaving, expanded: isEditing }}
              disabled={isSaving || isSigningOut}
              hitSlop={12}
              onPress={() => (isEditing ? void saveName() : startEditing())}
              className="active:opacity-55 disabled:opacity-55"
            >
              {isSaving ? (
                <ActivityIndicator color="#171717" size="small" />
              ) : (
                <HugeiconsIcon color="#07132D" icon={Edit02Icon} size={24} />
              )}
            </Pressable>
          </View>

          <Typography selectable className="text-sm text-ink">
            Profile
          </Typography>
          <View className="min-h-[50px] justify-center rounded-2xl border border-border bg-panel px-4">
            {isEditing ? (
              <View className="py-2">
                <View className="min-h-[50px] flex-row items-center gap-4">
                  <Typography selectable className="text-sm text-ink">
                    Name
                  </Typography>
                  <TextInput
                    accessibilityLabel="Name"
                    autoFocus
                    editable={!isSaving}
                    onChangeText={setDraftName}
                    onSubmitEditing={() => void saveName()}
                    placeholder="Your name"
                    placeholderTextColor="#C4C4C7"
                    returnKeyType="done"
                    className="flex-1 py-0 text-right text-sm text-ink"
                    value={draftName}
                  />
                </View>
                <View className="flex-row items-center justify-end gap-4 pt-4">
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSaving}
                    onPress={cancelEditing}
                    className="active:opacity-55"
                  >
                    <Typography className="text-sm text-supporting">Cancel</Typography>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ busy: isSaving }}
                    disabled={isSaving}
                    onPress={() => void saveName()}
                    className="h-9 min-w-18 items-center justify-center rounded-xl bg-danger px-4 active:opacity-72"
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Typography className="text-sm text-on-dark">Save</Typography>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="min-h-[50px] flex-row items-center gap-4">
                <Typography selectable className="text-sm text-ink">
                  Name
                </Typography>
                <Typography
                  selectable
                  numberOfLines={1}
                  className="flex-1 text-right text-sm text-supporting"
                >
                  {user?.name || "Add your name"}
                </Typography>
              </View>
            )}
          </View>
          <View className="min-h-[50px] justify-center rounded-2xl border border-border bg-panel px-4">
            <View className="min-h-[50px] flex-row items-center gap-4">
              <Typography selectable className="text-sm text-ink">
                Email
              </Typography>
              <Typography
                selectable
                numberOfLines={1}
                className="flex-1 text-right text-sm text-supporting"
              >
                {user?.email ?? ""}
              </Typography>
            </View>
          </View>

          <Typography selectable className="text-sm text-ink">
            Account Settings
          </Typography>
          <View className="min-h-[50px] justify-center rounded-2xl border border-border bg-panel px-4">
            <View className="min-h-[50px] flex-row items-center gap-4">
              <Typography selectable className="text-sm text-ink">
                Password
              </Typography>
              <Typography
                selectable
                className="flex-1 text-right text-xs tracking-[1px] text-supporting"
              >
                **********
              </Typography>
            </View>
          </View>

          <Typography selectable className="text-sm text-danger">
            Danger Zone
          </Typography>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSigningOut }}
            disabled={isSigningOut || isSaving}
            onPress={() => void signOut()}
            className="h-[50px] items-center justify-center rounded-2xl bg-danger active:opacity-72 disabled:opacity-72"
          >
            {isSigningOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Typography className="text-sm text-on-dark">Logout</Typography>
            )}
          </Pressable>

          <View className="gap-1 rounded-2xl border border-danger bg-danger/10 p-4">
            <Typography selectable className="text-sm text-danger">
              Deleting Account
            </Typography>
            <Typography selectable className="text-xs leading-[15px] text-ink">
              When you delete your account, expenses currently attached to you will not be deleted.
              You will no longer be able to access any of your data.
            </Typography>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDeletionMessage("Account deletion is not available yet.")}
              className="h-[50px] items-center justify-center rounded-2xl bg-danger active:opacity-72"
            >
              <Typography className="text-sm text-on-dark">Delete Account</Typography>
            </Pressable>
            {deletionMessage ? (
              <Typography
                selectable
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                className="text-center text-xs text-danger"
              >
                {deletionMessage}
              </Typography>
            ) : null}
          </View>

          {errorMessage ? (
            <Typography
              selectable
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="text-center text-xs text-danger"
            >
              {errorMessage}
            </Typography>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
