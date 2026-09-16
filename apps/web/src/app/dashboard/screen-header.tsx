import Link from "next/link";
import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";

import type { Route } from "next";

/** The native screen header: a back control, the screen title, and optional trailing actions. */
export function ScreenHeader({
  backHref,
  title,
  align = "start",
  children,
}: {
  backHref?: Route;
  title: ReactNode;
  align?: "start" | "center";
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {backHref ? (
        <Link href={backHref} aria-label="Go back" className="icon-button">
          <HugeiconsIcon icon={ChevronLeftFreeIcons} size={24} />
        </Link>
      ) : (
        <span className="size-12 shrink-0" />
      )}
      <h1
        className={`min-w-0 flex-1 text-2xl font-semibold break-words text-ink ${align === "center" ? "text-center" : ""}`}
      >
        {title}
      </h1>
      {children ?? <span className="size-12 shrink-0" />}
    </div>
  );
}
