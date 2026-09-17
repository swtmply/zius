"use client";

import type { Dispatch, SetStateAction } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add, Delete02Icon } from "@hugeicons/core-free-icons";

export type ParticipantDraft = { name: string; email: string; share: string; paid: boolean };

export function Participants({
  participants,
  setParticipants,
  splitMethod = "equal",
}: {
  participants: ParticipantDraft[];
  setParticipants: Dispatch<SetStateAction<ParticipantDraft[]>>;
  splitMethod?: string;
}) {
  function update(index: number, changes: Partial<ParticipantDraft>) {
    setParticipants(
      participants.map((person, position) =>
        position === index ? { ...person, ...changes } : person,
      ),
    );
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm text-ink">Participants</h2>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-full bg-ink px-3 text-xs font-medium text-on-ink"
          onClick={() =>
            setParticipants([...participants, { name: "", email: "", share: "0", paid: false }])
          }
        >
          <HugeiconsIcon icon={Add} size={16} />
          Add person
        </button>
      </div>
      <div className="panel space-y-4">
        {participants.length === 0 ? (
          <p className="text-center text-xs text-supporting">
            Add the people who share this expense.
          </p>
        ) : null}
        {participants.map((person, index) => (
          <div key={index} className="space-y-2">
            {index > 0 ? <div className="dashed-divider" /> : null}
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="field">
                Name
                <input
                  required
                  value={person.name}
                  onChange={(event) => update(index, { name: event.target.value })}
                />
              </label>
              <label className="field">
                Email
                <input
                  type="email"
                  required
                  value={person.email}
                  onChange={(event) => update(index, { email: event.target.value })}
                />
              </label>
              {["fixed", "percentage"].includes(splitMethod) ? (
                <label className="field">
                  {splitMethod === "percentage"
                    ? "Percentage (0 = automatic)"
                    : "Amount (0 = automatic)"}
                  <input
                    className="font-semibold"
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                    max={splitMethod === "percentage" ? 100 : undefined}
                    required
                    value={person.share}
                    onChange={(event) => update(index, { share: event.target.value })}
                  />
                </label>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {splitMethod === "group" ? (
                <span />
              ) : (
                <label className="flex min-h-11 items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={person.paid}
                    onChange={(event) => update(index, { paid: event.target.checked })}
                  />
                  Already paid
                </label>
              )}
              <button
                type="button"
                className="flex min-h-11 items-center gap-1 text-xs text-destructive"
                onClick={() =>
                  setParticipants(participants.filter((_, position) => position !== index))
                }
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                Remove {person.name || "person"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
