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

export function GroupForm() {
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
          const form = new FormData(event.currentTarget);

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
              description: "Your group has been created.",
            });
            router.push(dashboardRoutes.group(result.id));
          } catch (error) {
            setError(error instanceof Error ? error.message : "Could not create group.");
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
          <button type="submit" className="action w-full bg-dark-gradient">
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
