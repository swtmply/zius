"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

/** The detached bottom sheet the native app uses for filters and confirmations. */
export function Sheet({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.target === dialogRef.current) onOpenChange(false);
      }}
      className="dashboard fixed inset-0 m-0 h-dvh max-h-dvh w-dvw max-w-none bg-transparent p-0 backdrop:bg-black/40 open:flex"
    >
      <div className="mt-auto w-full p-3 sm:m-auto sm:max-w-md">
        <div className="flex max-h-[80dvh] flex-col gap-4 overflow-y-auto rounded-[32px] bg-panel p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-2xl font-semibold text-ink">{title}</h2>
              {description ? <p className="text-sm text-supporting">{description}</p> : null}
            </div>
            <button
              type="button"
              aria-label={`Close ${title.toLowerCase()}`}
              className="icon-button size-9 bg-page"
              onClick={() => onOpenChange(false)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </dialog>
  );
}
