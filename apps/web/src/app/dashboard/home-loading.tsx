import { Skeleton } from "./skeleton";

function HeaderCardLoading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["owe", "owed"].map((item) => (
          <div
            key={item}
            className="flex-1 space-y-2 rounded-2xl bg-dark-gradient p-4"
          >
            <Skeleton className="h-5 w-20 bg-white/15" />
            <Skeleton className="h-8 w-24 bg-white/15" />
          </div>
        ))}
      </div>
      <div className="panel flex items-start">
        {["expense", "groups", "history", "more"].map((item) => (
          <div key={item} className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ExpenseCardLoading() {
  return (
    <div className="panel space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="dashed-divider" />
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="size-8 rounded-full" />
        ))}
      </div>
    </div>
  );
}

export function ExpenseListLoading({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2" aria-label="Loading expenses" aria-busy>
      {Array.from({ length: count }, (_, index) => (
        <ExpenseCardLoading key={index} />
      ))}
    </div>
  );
}

function ExpenseSectionLoading({ title }: { title: string }) {
  return (
    <section className="space-y-2">
      <div className="flex h-12 items-center justify-between gap-4">
        <h2 className="text-sm text-ink">{title}</h2>
        <Skeleton className="h-4 w-16" />
      </div>
      <ExpenseListLoading count={2} />
    </section>
  );
}

export function HomeLoading() {
  return (
    <div className="space-y-2" aria-label="Loading dashboard" aria-busy>
      <HeaderCardLoading />
      <ExpenseSectionLoading title="Unsettled Expenses" />
      <ExpenseSectionLoading title="Settled Expenses" />
    </div>
  );
}
