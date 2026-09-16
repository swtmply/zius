"use client";

import { createContext, use, type ReactNode } from "react";

export type DashboardUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

const UserContext = createContext<DashboardUser | null>(null);

export function UserProvider({ user, children }: { user: DashboardUser; children: ReactNode }) {
  return <UserContext value={user}>{children}</UserContext>;
}

export function useUser() {
  const user = use(UserContext);
  if (!user) throw new Error("useUser must be used inside a UserProvider.");
  return user;
}
