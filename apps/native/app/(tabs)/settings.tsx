import { Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
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
      error: { message: error instanceof Error ? error.message : "Unable to update your name." },
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
      error: { message: error instanceof Error ? error.message : "Unable to log out." },
    }));
    setIsSigningOut(false);

    if (result.error) {
      setErrorMessage(result.error.message || "Unable to log out.");
      return;
    }

    queryClient.clear();
  };

  return (
    <View className="flex-1 bg-white">
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
            <Text selectable className="text-[24px] font-semibold tracking-[-0.5px] text-black">
              Settings
            </Text>
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

          <Text selectable className="text-[14px] text-[#171717]">
            Profile
          </Text>
          <View className="min-h-[50px] justify-center rounded-2xl border-continuous bg-white px-4 shadow-[0_9px_26px_rgba(0,0,0,0.12)]">
            {isEditing ? (
              <View className="py-2">
                <View className="min-h-[50px] flex-row items-center gap-4">
                  <Text selectable className="text-[14px] text-[#171717]">
                    Name
                  </Text>
                  <TextInput
                    accessibilityLabel="Name"
                    autoFocus
                    editable={!isSaving}
                    onChangeText={setDraftName}
                    onSubmitEditing={() => void saveName()}
                    placeholder="Your name"
                    placeholderTextColor="#C4C4C7"
                    returnKeyType="done"
                    className="flex-1 py-0 text-right text-[14px] text-[#171717]"
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
                    <Text className="text-[14px] text-[#929292]">Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ busy: isSaving }}
                    disabled={isSaving}
                    onPress={() => void saveName()}
                    className="h-9 min-w-18 items-center justify-center rounded-xl border-continuous bg-[#FF343B] px-4 active:opacity-72"
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text className="text-[14px] text-white">Save</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="min-h-[50px] flex-row items-center gap-4">
                <Text selectable className="text-[14px] text-[#171717]">
                  Name
                </Text>
                <Text
                  selectable
                  numberOfLines={1}
                  className="flex-1 text-right text-[14px] text-[#929292]"
                >
                  {user?.name || "Add your name"}
                </Text>
              </View>
            )}
          </View>
          <View className="min-h-[50px] justify-center rounded-2xl border-continuous bg-white px-4 shadow-[0_9px_26px_rgba(0,0,0,0.12)]">
            <View className="min-h-[50px] flex-row items-center gap-4">
              <Text selectable className="text-[14px] text-[#171717]">
                Email
              </Text>
              <Text
                selectable
                numberOfLines={1}
                className="flex-1 text-right text-[14px] text-[#929292]"
              >
                {user?.email ?? ""}
              </Text>
            </View>
          </View>

          <Text selectable className="text-[14px] text-[#171717]">
            Account Settings
          </Text>
          <View className="min-h-[50px] justify-center rounded-2xl border-continuous bg-white px-4 shadow-[0_9px_26px_rgba(0,0,0,0.12)]">
            <View className="min-h-[50px] flex-row items-center gap-4">
              <Text selectable className="text-[14px] text-[#171717]">
                Password
              </Text>
              <Text
                selectable
                className="flex-1 text-right text-[12px] tracking-[1px] text-[#929292]"
              >
                **********
              </Text>
            </View>
          </View>

          <Text selectable className="text-[14px] text-[#FF343B]">
            Danger Zone
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSigningOut }}
            disabled={isSigningOut || isSaving}
            onPress={() => void signOut()}
            className="h-[50px] items-center justify-center rounded-2xl border-continuous bg-[#FF343B] active:opacity-72 disabled:opacity-72"
          >
            {isSigningOut ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-[14px] text-white">Logout</Text>
            )}
          </Pressable>

          <View className="gap-1 rounded-2xl border border-continuous border-[#FF343B] bg-[#FFD9DB] p-4">
            <Text selectable className="text-[14px] text-[#FF343B]">
              Deleting Account
            </Text>
            <Text selectable className="text-[12px] leading-[15px] text-[#171717]">
              When you delete your account, transactions currently attached to you will not be
              deleted. You will no longer be able to access any of your data.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDeletionMessage("Account deletion is not available yet.")}
              className="h-[50px] items-center justify-center rounded-2xl border-continuous bg-[#FF343B] active:opacity-72"
            >
              <Text className="text-[14px] text-white">Delete Account</Text>
            </Pressable>
            {deletionMessage ? (
              <Text
                selectable
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                className="text-center text-[12px] text-[#FF343B]"
              >
                {deletionMessage}
              </Text>
            ) : null}
          </View>

          {errorMessage ? (
            <Text
              selectable
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="text-center text-[12px] text-[#FF343B]"
            >
              {errorMessage}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
