export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="panel flex flex-col items-center gap-2 text-center">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-supporting">{description}</p>
    </div>
  );
}
