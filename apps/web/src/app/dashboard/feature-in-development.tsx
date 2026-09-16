import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronLeftFreeIcons } from "@hugeicons/core-free-icons";

import { dashboardRoutes } from "./routes";

export function FeatureInDevelopment() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-ink">
          The developer is working on this feature
        </h1>
        <p className="text-xs text-supporting">
          This page is still under construction. Please check back soon.
        </p>
      </div>
      <Link href={dashboardRoutes.home} className="action-secondary">
        <HugeiconsIcon icon={ChevronLeftFreeIcons} size={20} />
        Back
      </Link>
    </div>
  );
}
