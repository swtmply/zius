"use client";

import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

import { UserProvider } from "./user-context";

export function DashboardShell({
  session,
  children,
}: {
  session: typeof authClient.$Infer.Session;
  children: ReactNode;
}) {
  const { data: liveSession } = authClient.useSession();
  const user = liveSession?.user ?? session.user;

  return (
    <UserProvider user={user}>
      <div className="dashboard min-h-dvh bg-page text-ink">
        <main className="mx-auto w-full max-w-3xl space-y-2 px-4 pt-4 pb-24">{children}</main>
      </div>
    </UserProvider>
  );
}
