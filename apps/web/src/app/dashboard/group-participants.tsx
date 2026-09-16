import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zius/api/routers/index";

import { Avatar } from "./avatar";

type GroupParticipant = inferRouterOutputs<AppRouter>["group"]["get"]["participants"][number];

export function GroupParticipants({
  participants,
  folded,
}: {
  participants: GroupParticipant[];
  folded: boolean;
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
            </div>
          ),
        )}
      </div>
    </div>
  );
}
