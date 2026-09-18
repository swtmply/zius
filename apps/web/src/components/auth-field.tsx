import { ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { Input } from "@zius/ui/components/input";
import { Label } from "@zius/ui/components/label";
import { useState } from "react";

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
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col gap-2">
      <Label className={fieldLabel} htmlFor={field.name}>
        {label}
      </Label>
      <div className="relative">
        <Input
          aria-invalid={errors.length > 0 || undefined}
          autoComplete={autoComplete}
          className={`${fieldInput} ${isPassword ? "pr-11" : ""}`}
          id={field.name}
          name={field.name}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
          type={isPassword && visible ? "text" : type}
          value={field.state.value as string}
        />
        {isPassword ? (
          <button
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-black/45 hover:text-black"
            onClick={() => setVisible((v) => !v)}
            type="button"
          >
            <HugeiconsIcon icon={visible ? ViewOffSlashIcon : ViewIcon} size={18} />
          </button>
        ) : null}
      </div>
      {errors.map((error) => (
        <p className="text-xs text-[#ff3b30]" key={error?.message}>
          {error?.message}
        </p>
      ))}
    </div>
  );
}
