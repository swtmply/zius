"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification, RefreshIcon } from "@hugeicons/core-free-icons";

import { Avatar } from "./avatar";
import { dashboardRoutes } from "./routes";
import { useUser } from "./user-context";

export function DashboardHeader({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  const user = useUser();

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Refresh dashboard"
          className="icon-button"
          disabled={isRefreshing}
          onClick={onRefresh}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            size={24}
            className={isRefreshing ? "animate-spin" : undefined}
          />
        </button>
        <Link
          href={dashboardRoutes.notifications}
          aria-label="Notifications"
          className="icon-button"
        >
          <HugeiconsIcon icon={Notification} size={24} />
        </Link>
        <Link href={dashboardRoutes.settings} aria-label="Open settings" className="icon-button">
          <Avatar person={user} className="size-10 bg-panel text-sm" />
        </Link>
      </div>
    </div>
  );
}
