"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/trpc";

import { dashboardRoutes } from "./routes";
import { ScreenHeader } from "./screen-header";
import { useUser } from "./user-context";

function SettingsRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-[50px] items-center gap-4 rounded-2xl border border-border bg-panel px-4 py-2">
      <span className="text-sm text-ink">{label}</span>
      {children}
    </div>
  );
}

export function Settings() {
  const user = useUser();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deletionMessage, setDeletionMessage] = useState("");

  async function saveName() {
    if (isSaving || isSigningOut) return;

    const name = draftName.trim();
    if (!name) {
      setErrorMessage("Enter your name before saving.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);
    const toastId = toast.loading("Updating profile", { description: "Saving your name." });
    try {
      const result = await authClient.updateUser({ name });
      if (result.error) throw new Error(result.error.message);
      setIsEditing(false);
      toast.success("Profile updated", { id: toastId, description: "Your name has been updated." });
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update your name.";
      setErrorMessage(message);
      toast.error("Failed to update profile", { id: toastId, description: message });
    } finally {
      setIsSaving(false);
    }
  }

  async function signOut() {
    if (isSaving || isSigningOut) return;

    setErrorMessage("");
    setIsSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to log out.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className="space-y-4">
      <ScreenHeader backHref={dashboardRoutes.home} title="Settings">
        <button
          type="button"
          aria-label={isEditing ? "Save name" : "Edit name"}
          aria-expanded={isEditing}
          className="icon-button"
          disabled={isSaving || isSigningOut}
          onClick={() => {
            if (isEditing) {
              void saveName();
              return;
            }
            setDraftName(user.name);
            setErrorMessage("");
            setIsEditing(true);
          }}
        >
          <HugeiconsIcon icon={Edit02Icon} size={24} />
        </button>
      </ScreenHeader>

      <h2 className="text-sm text-ink">Profile</h2>
      {isEditing ? (
        <div className="space-y-4 rounded-2xl border border-border bg-panel px-4 py-2">
          <label className="flex min-h-[50px] items-center gap-4 text-sm text-ink">
            Name
            <input
              autoFocus
              value={draftName}
              disabled={isSaving}
              placeholder="Your name"
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void saveName();
              }}
              className="min-h-11 flex-1 rounded-xl border border-input bg-panel px-3 text-right text-sm text-ink"
            />
          </label>
          <div className="flex items-center justify-end gap-4 pb-2">
            <button
              type="button"
              className="min-h-11 text-sm text-supporting"
              disabled={isSaving}
              onClick={() => {
                setDraftName(user.name);
                setErrorMessage("");
                setIsEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="action h-9 min-w-18"
              disabled={isSaving}
              onClick={() => void saveName()}
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <SettingsRow label="Name">
          <span className="flex-1 truncate text-right text-sm text-supporting">
            {user.name || "Add your name"}
          </span>
        </SettingsRow>
      )}
      <SettingsRow label="Email">
        <span className="flex-1 truncate text-right text-sm text-supporting">{user.email}</span>
      </SettingsRow>

      <h2 className="text-sm text-ink">Account Settings</h2>
      <SettingsRow label="Password">
        <span className="flex-1 text-right text-xs tracking-[1px] text-supporting">**********</span>
      </SettingsRow>

      <h2 className="text-sm text-destructive">Danger Zone</h2>
      <button
        type="button"
        className="action-danger h-[50px] w-full"
        disabled={isSigningOut || isSaving}
        onClick={() => void signOut()}
      >
        {isSigningOut ? "Logging out…" : "Logout"}
      </button>

      <div className="space-y-2 rounded-2xl border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">Deleting Account</p>
        <p className="text-xs leading-4 text-ink">
          When you delete your account, expenses currently attached to you will not be deleted. You
          will no longer be able to access any of your data.
        </p>
        <button
          type="button"
          className="action-danger h-[50px] w-full"
          onClick={() => setDeletionMessage("Account deletion is not available yet.")}
        >
          Delete Account
        </button>
        {deletionMessage ? (
          <p role="status" className="text-center text-xs text-destructive">
            {deletionMessage}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
