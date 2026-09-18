"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import { refreshDashboard } from "./mutations";
import { Participants, type ParticipantDraft } from "./participants";
import { dashboardRoutes } from "./routes";
import { ScreenHeader } from "./screen-header";
import { useUser } from "./user-context";

export function GroupForm() {
  const user = useUser();
  const router = useRouter();
  const [participants, setParticipants] = useState<ParticipantDraft[]>([]);
  const [error, setError] = useState("");
  const createGroup = useMutation(trpc.group.create.mutationOptions());

  return (
    <div className="space-y-4">
      <ScreenHeader backHref={dashboardRoutes.groups} title="Create group" />
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");

          const members = new Set([
            user.email.toLowerCase(),
            ...participants.map((person) => person.email.trim().toLowerCase()),
          ]);

          if (members.size < 2) {
            toast.error("Add another participant", {
              description: "A group needs at least two participants.",
            });
            return;
          }

          const form = new FormData(event.currentTarget);
          const toastId = toast.loading("Creating group", {
            description: "Saving your group, hang tight.",
          });

          try {
            const result = await createGroup.mutateAsync({
              name: String(form.get("name")).trim(),
              participants: participants.map((person) => ({
                name: person.name.trim(),
                email: person.email.trim().toLowerCase(),
              })),
            });
            await refreshDashboard();
            toast.success("Group created successfully", {
              id: toastId,
              description: "Your group has been created.",
            });
            router.push(dashboardRoutes.group(result.id));
          } catch (error) {
            const message = error instanceof Error ? error.message : "Could not create group.";
            setError(message);
            toast.error("Failed to create group", { id: toastId, description: message });
          }
        }}
      >
        <fieldset className="space-y-4" disabled={createGroup.isPending}>
          <div className="panel space-y-2">
            <label className="field">
              Group name
              <input name="name" required placeholder="Weekend trip" />
            </label>
            <p className="text-xs text-supporting">
              You’re included automatically as the group owner.
            </p>
          </div>
          <Participants
            participants={participants}
            setParticipants={setParticipants}
            splitMethod="group"
          />
          <button type="submit" className="action w-full bg-contrast-gradient">
            {createGroup.isPending ? "Creating…" : "Create group"}
          </button>
        </fieldset>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
