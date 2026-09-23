import { ChevronLeftFreeIcons, Edit02Icon } from "@hugeicons/core-free-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ActivityIndicator, Keyboard, ScrollView, View } from "react-native";
import { Button, Input, PressableFeedback, Typography, Switch, useToast } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icon";
import { ExpenseCreationToast, showPendingToast } from "@/components/layout/expense-creation-toast";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "@/utils/navigation";
import {
  getAlwaysShowOnboardingPages,
  getAlwaysShowSpotlights,
  setAlwaysShowOnboardingPages,
  setAlwaysShowSpotlights,
} from "@/utils/spotlights";
import { clearPersistedQueryCache } from "@/utils/trpc";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const [alwaysShowSpotlights, setAlwaysShowSpotlightsState] = useState<boolean | null>(
    __DEV__ ? null : false,
  );
  const [alwaysShowOnboardingPages, setAlwaysShowOnboardingPagesState] = useState<boolean | null>(
    __DEV__ ? null : false,
  );

  useEffect(() => {
    if (!__DEV__) return;

    let isMounted = true;

    void Promise.all([getAlwaysShowSpotlights(), getAlwaysShowOnboardingPages()])
      .then(([spotlightsEnabled, onboardingPagesEnabled]) => {
        if (isMounted) {
          setAlwaysShowSpotlightsState(spotlightsEnabled);
          setAlwaysShowOnboardingPagesState(onboardingPagesEnabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAlwaysShowSpotlightsState(false);
          setAlwaysShowOnboardingPagesState(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateAlwaysShowSpotlights = (enabled: boolean) => {
    setAlwaysShowSpotlightsState(enabled);
    void setAlwaysShowSpotlights(enabled).catch(() => {
      console.warn("Could not persist always-show-spotlights setting");
      setAlwaysShowSpotlightsState(!enabled);
    });
  };

  const updateAlwaysShowOnboardingPages = (enabled: boolean) => {
    setAlwaysShowOnboardingPagesState(enabled);
    void setAlwaysShowOnboardingPages(enabled).catch(() => {
      console.warn("Could not persist always-show-onboarding-pages setting");
      setAlwaysShowOnboardingPagesState(!enabled);
    });
  };

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
    showPendingToast(toast, "Updating profile", "Saving your name.");
    const result = await authClient.updateUser({ name }).catch((error: unknown) => ({
      error: {
        message: error instanceof Error ? error.message : "Unable to update your name.",
      },
    }));
    setIsSaving(false);
    toast.hide("all");

    if (result.error) {
      const description = result.error.message || "Unable to update your name.";
      setErrorMessage(description);
      toast.show({
        duration: 6000,
        component: (props) => (
          <ExpenseCreationToast
            {...props}
            variant="danger"
            title="Failed to update profile"
            description={description}
          />
        ),
      });
      return;
    }

    setDraftName(name);
    setIsEditing(false);
    void queryClient.invalidateQueries();
    Keyboard.dismiss();
    toast.show({
      component: (props) => (
        <ExpenseCreationToast
          {...props}
          variant="success"
          title="Profile updated"
          description="Your name has been updated."
        />
      ),
    });
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

    await clearPersistedQueryCache();
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
            <Button
              isIconOnly
              variant="ghost"
              accessibilityLabel="Go back"
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/home"))}
            >
              <Icon icon={ChevronLeftFreeIcons} size={24} colorClassName="accent-ink" />
            </Button>
            <Typography selectable className="flex-1 text-2xl font-semibold text-ink">
              Settings
            </Typography>
            <Button
              isIconOnly
              variant="ghost"
              accessibilityLabel={isEditing ? "Save name" : "Edit name"}
              accessibilityState={{ busy: isSaving, expanded: isEditing }}
              isDisabled={isSaving || isSigningOut}
              onPress={() => (isEditing ? void saveName() : startEditing())}
              className="size-12 rounded-full"
            >
              {isSaving ? (
                <ActivityIndicator colorClassName="accent-ink" size="small" />
              ) : (
                <Icon colorClassName="accent-ink" icon={Edit02Icon} size={24} />
              )}
            </Button>
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
                  <Input
                    accessibilityLabel="Name"
                    autoFocus
                    isDisabled={isSaving}
                    onChangeText={setDraftName}
                    onSubmitEditing={() => void saveName()}
                    placeholder="Your name"
                    placeholderColorClassName="accent-muted"
                    returnKeyType="done"
                    background={null}
                    className="flex-1 h-[50px] border-0 bg-transparent py-0 text-right text-sm text-ink android:border-0"
                    value={draftName}
                  />
                </View>
                <View className="flex-row items-center justify-end gap-4 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    isDisabled={isSaving}
                    onPress={cancelEditing}
                    className="h-9 min-h-0"
                  >
                    <Button.Label className="text-sm text-supporting">Cancel</Button.Label>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    accessibilityState={{ busy: isSaving }}
                    isDisabled={isSaving}
                    onPress={() => void saveName()}
                    className="h-9 min-h-0 min-w-18 rounded-xl bg-danger px-4"
                  >
                    {isSaving ? (
                      <ActivityIndicator colorClassName="accent-danger-foreground" size="small" />
                    ) : (
                      <Button.Label className="text-sm text-danger-foreground">Save</Button.Label>
                    )}
                  </Button>
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

          {__DEV__ ? (
            <>
              <Typography selectable className="text-[14px] text-ink">
                Developer Options
              </Typography>
              <View className="min-h-[50px] justify-center rounded-2xl border-continuous bg-panel px-4 shadow-[0_9px_26px_rgba(0,0,0,0.12)]">
                <View className="min-h-[50px] flex-row items-center gap-4">
                  <Typography selectable className="flex-1 text-[14px] text-ink">
                    Always show spotlights on load
                  </Typography>
                  <Switch
                    accessibilityLabel="Always show spotlights on load"
                    isDisabled={alwaysShowSpotlights === null}
                    isSelected={alwaysShowSpotlights ?? false}
                    onSelectedChange={updateAlwaysShowSpotlights}
                  />
                </View>
              </View>
              <View className="min-h-[50px] justify-center rounded-2xl border-continuous bg-panel px-4 shadow-[0_9px_26px_rgba(0,0,0,0.12)]">
                <View className="min-h-[50px] flex-row items-center gap-4">
                  <Typography selectable className="flex-1 text-[14px] text-ink">
                    Always show onboarding pages on load
                  </Typography>
                  <Switch
                    accessibilityLabel="Always show onboarding pages on load"
                    isDisabled={alwaysShowOnboardingPages === null}
                    isSelected={alwaysShowOnboardingPages ?? false}
                    onSelectedChange={updateAlwaysShowOnboardingPages}
                  />
                </View>
              </View>
              <PressableFeedback
                accessibilityLabel="Show persistent debug toast"
                accessibilityRole="button"
                onPress={() =>
                  toast.show({
                    duration: "persistent",
                    component: (props) => (
                      <ExpenseCreationToast
                        {...props}
                        variant="success"
                        title="Debug toast"
                        description="Persistent toast, stays until dismissed."
                      />
                    ),
                  })
                }
                className="min-h-[50px] justify-center rounded-2xl border-continuous bg-panel px-4 shadow-[0_9px_26px_rgba(0,0,0,0.12)]"
              >
                <View className="min-h-[50px] flex-row items-center gap-4">
                  <Typography selectable={false} className="flex-1 text-[14px] text-ink">
                    Show persistent debug toast
                  </Typography>
                </View>
              </PressableFeedback>
            </>
          ) : null}

          <Typography selectable className="text-[14px] text-danger">
            Danger Zone
          </Typography>
          <Button
            variant="danger"
            accessibilityState={{ busy: isSigningOut }}
            isDisabled={isSigningOut || isSaving}
            onPress={() => void signOut()}
            className="h-[50px] rounded-2xl bg-danger disabled:opacity-72"
          >
            {isSigningOut ? (
              <ActivityIndicator colorClassName="accent-danger-foreground" />
            ) : (
              <Button.Label className="text-sm text-danger-foreground">Logout</Button.Label>
            )}
          </Button>

          <View className="gap-1 rounded-2xl border border-danger bg-danger/10 p-4">
            <Typography selectable className="text-sm text-danger">
              Deleting Account
            </Typography>
            <Typography selectable className="text-xs leading-[15px] text-ink">
              When you delete your account, expenses currently attached to you will not be deleted.
              You will no longer be able to access any of your data.
            </Typography>
            <Button
              variant="danger"
              onPress={() => setDeletionMessage("Account deletion is not available yet.")}
              className="h-[50px] rounded-2xl bg-danger"
            >
              <Button.Label className="text-sm text-danger-foreground">Delete Account</Button.Label>
            </Button>
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
