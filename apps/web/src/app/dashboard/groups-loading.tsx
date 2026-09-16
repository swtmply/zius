import { Skeleton } from "./skeleton";

export function GroupsLoading({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading groups" aria-busy>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="panel space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <div className="dashed-divider pt-3">
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((participant) => (
                <Skeleton key={participant} className="size-8 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
