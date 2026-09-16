import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@zius/ui/components/input";
import { Label } from "@zius/ui/components/label";

import { fieldInput, fieldLabel } from "./marketing/styles";

export function AuthField({
  field,
  label,
  type = "text",
  autoComplete,
  placeholder,
}: {
  field: AnyFieldApi;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const errors = field.state.meta.errors;

  return (
    <div className="flex flex-col gap-2">
      <Label className={fieldLabel} htmlFor={field.name}>
        {label}
      </Label>
      <Input
        aria-invalid={errors.length > 0 || undefined}
        autoComplete={autoComplete}
        className={fieldInput}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        value={field.state.value as string}
      />
      {errors.map((error) => (
        <p className="text-xs text-[#ff3b30]" key={error?.message}>
          {error?.message}
        </p>
      ))}
    </div>
  );
}
