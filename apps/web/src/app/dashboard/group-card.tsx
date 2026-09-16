import Link from "next/link";

import { AvatarStack } from "./avatar";
import { dashboardRoutes } from "./routes";

export type GroupCardGroup = {
  id: string;
  name: string;
  archivedAt: string | null;
  participants: readonly { id: string; name: string; image: string | null }[];
};

export function GroupCard({ group }: { group: GroupCardGroup }) {
  return (
    <Link
      href={dashboardRoutes.group(group.id)}
      className="panel block space-y-3 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{group.name}</span>
        {group.archivedAt ? (
          <span className="rounded-full bg-page px-2 py-1 text-[10px] text-supporting">
            Archived
          </span>
        ) : null}
      </div>

      <div className="dashed-divider pt-3">
        <AvatarStack people={group.participants} />
      </div>
    </Link>
  );
}
