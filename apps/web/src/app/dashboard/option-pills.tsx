export function OptionPills<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div className="space-y-2">
      <p id={`${label}-pills`} className="text-sm text-ink">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={`${label}-pills`} className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`min-h-9 rounded-full px-4 text-sm transition-opacity active:opacity-70 ${
              value === option.value ? "bg-ink text-on-ink" : "bg-page text-ink"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
