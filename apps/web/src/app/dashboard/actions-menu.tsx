"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreHorizontal } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

export function ActionsMenu({
  label,
  isDisabled,
  children,
}: {
  label: string;
  isDisabled?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isDisabled}
        className="icon-button"
        onClick={() => setIsOpen((open) => !open)}
      >
        <HugeiconsIcon icon={MoreHorizontal} size={24} />
      </button>
      {isOpen ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 w-44 space-y-1 rounded-2xl bg-panel p-2 shadow-xl ring-1 ring-black/5"
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ActionsMenuItem({
  icon,
  label,
  isDisabled,
  variant = "default",
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  isDisabled?: boolean;
  variant?: "default" | "danger";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={isDisabled}
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-sm transition-colors hover:bg-page disabled:pointer-events-none disabled:opacity-50 ${
        variant === "danger" ? "text-destructive" : "text-ink"
      }`}
    >
      <HugeiconsIcon icon={icon} size={18} />
      {label}
    </button>
  );
}
