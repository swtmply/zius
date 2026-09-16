export function Switch({
  label,
  isSelected,
  isDisabled,
  onSelectedChange,
}: {
  label: string;
  isSelected: boolean;
  isDisabled?: boolean;
  onSelectedChange: (isSelected: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={isSelected}
      disabled={isDisabled}
      onClick={() => onSelectedChange(!isSelected)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        isSelected ? "bg-ink" : "border border-border bg-page"
      }`}
    >
      <span
        className={`mx-0.5 size-6 rounded-full bg-panel shadow transition-transform ${
          isSelected ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
