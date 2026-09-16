import type { Route } from "next";

export const dashboardRoutes = {
  home: "/dashboard",
  expenses: "/dashboard/expenses",
  expense: (id: string) => `/dashboard/expenses/${id}` as const,
  groups: "/dashboard/groups",
  group: (id: string) => `/dashboard/groups/${id}` as const,
  createExpense: "/dashboard/create-expense",
  createGroup: "/dashboard/create-group",
  settings: "/dashboard/settings",
  scan: "/dashboard/scan",
  notifications: "/dashboard/notifications",
} as const;

/** Appends query values to a route, dropping empty ones the way the native router does. */
export function withQuery<T extends Route>(
  path: T,
  query: Record<string, string | undefined>,
): T | `${T}?${string}` {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
