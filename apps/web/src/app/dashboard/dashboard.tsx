"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@zius/ui/components/tabs";

import { authClient } from "@/lib/auth-client";
import { ExpenseTable } from "./expense-table";
import { GroupTable } from "./group-table";

export function Dashboard({ session }: { session: typeof authClient.$Infer.Session }) {
  const firstName = session.user.name?.trim().split(/\s+/)[0] || "there";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Personal workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Good to see you, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Keep an eye on shared spending and settle up without the awkward math.
          </p>
        </div>
        <div className="rounded-lg border bg-card px-3 py-2 text-right shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Signed in as</p>
          <p className="mt-0.5 max-w-56 truncate text-sm font-medium">{session.user.email}</p>
        </div>
      </div>

      <Tabs defaultValue="expenses">
        <div className="border-b">
          <TabsList variant="line" className="w-fit justify-start">
            <TabsTrigger value="expenses" className="flex-none px-4">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex-none px-4">
              Groups
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-none px-4">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="expenses" className="mt-6">
          <ExpenseTable />
        </TabsContent>
        <TabsContent value="groups" className="mt-6">
          <GroupTable />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card px-6 text-center">
            <h2 className="text-sm font-semibold">Settings</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage your account preferences here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
