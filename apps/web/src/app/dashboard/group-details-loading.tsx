import { ExpenseCardLoading } from "./home-loading";
import { Skeleton } from "./skeleton";

export function GroupParticipantsLoading({ folded }: { folded: boolean }) {
  return (
    <div className="panel">
      <div className={folded ? "flex flex-wrap items-center gap-1" : "space-y-2"}>
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            {folded ? null : <Skeleton className="h-4 w-28" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GroupExpensesSectionLoading({
  title,
  showAction = false,
}: {
  title: string;
  showAction?: boolean;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm text-ink">{title}</h2>
        {showAction ? <Skeleton className="h-8 w-28 rounded-full" /> : null}
      </div>
      <div className="space-y-2">
        {[0, 1].map((item) => (
          <ExpenseCardLoading key={item} />
        ))}
      </div>
    </section>
  );
}
