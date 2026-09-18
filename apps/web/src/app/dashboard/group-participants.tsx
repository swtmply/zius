import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";

import { Avatar } from "./avatar";

type GroupParticipant = inferRouterOutputs<AppRouter>["group"]["get"]["participants"][number];

export function GroupParticipants({
  participants,
  folded,
  onRemove,
  isRemovePending = false,
}: {
  participants: GroupParticipant[];
  folded: boolean;
  onRemove?: (person: GroupParticipant) => void;
  isRemovePending?: boolean;
}) {
  return (
    <div className="panel">
      <div className={folded ? "flex flex-wrap items-center gap-1" : "space-y-2"}>
        {participants.map((person) =>
          folded ? (
            <Avatar key={person.id} person={person} />
          ) : (
            <div key={person.id} className="flex items-center gap-2">
              <Avatar person={person} />
              <span className="min-w-0 truncate text-sm text-ink">{person.name}</span>
              {person.userId ? null : (
                <span className="rounded-full bg-page px-2 py-1 text-[10px] text-supporting">
                  Guest
                </span>
              )}
              <span className="ml-auto text-xs text-supporting capitalize">{person.role}</span>
              {onRemove && person.role !== "owner" ? (
                <button
                  type="button"
                  aria-label={`Remove ${person.name}`}
                  className="icon-button size-9 bg-page"
                  disabled={isRemovePending}
                  onClick={() => onRemove(person)}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                </button>
              ) : null}
            </div>
          ),
        )}
      </div>
    </div>
  );
}
