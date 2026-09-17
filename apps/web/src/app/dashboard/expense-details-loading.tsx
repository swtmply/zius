import { Skeleton } from "./skeleton";

export function ExpenseDetailsLoading() {
  return (
    <div className="space-y-4" aria-label="Loading expense details" aria-busy>
      <div className="flex items-center justify-between gap-4 py-4">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="size-12 rounded-full" />
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          {["total", "owed"].map((item) => (
            <div key={item} className="flex-1 space-y-2 rounded-2xl bg-contrast-gradient p-4">
              <Skeleton className="h-5 w-20 bg-on-ink/15" />
              <Skeleton className="h-8 w-24 bg-on-ink/15" />
            </div>
          ))}
        </div>

        <div className="panel flex items-start">
          {["payer", "split", "group", "category"].map((item) => (
            <div key={item} className="flex flex-1 flex-col items-center gap-1">
              <Skeleton className="size-12 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm text-ink">Expense Summary</h2>
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="panel space-y-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="space-y-2">
              {item > 0 ? <div className="dashed-divider" /> : null}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-1 items-center gap-1">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
