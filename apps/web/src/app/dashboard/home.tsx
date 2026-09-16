"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Scan } from "@hugeicons/core-free-icons";

import { trpc } from "@/utils/trpc";

import { DashboardExpenses } from "./dashboard-expenses";
import { DashboardHeader } from "./dashboard-header";
import { EmptyState } from "./empty-state";
import { DashboardHeaderCard } from "./header-card";
import { HomeLoading } from "./home-loading";
import { dashboardRoutes } from "./routes";

export function Home() {
  const query = useQuery(trpc.dashboard.get.queryOptions());
  const { data } = query;

  return (
    <>
      <DashboardHeader
        isRefreshing={query.isFetching}
        onRefresh={() => {
          void query.refetch();
        }}
      />
      {query.isPending ? (
        <HomeLoading />
      ) : !data ? (
        <div className="space-y-4">
          <EmptyState
            title="Could not load dashboard"
            description="Try again to load your balances and expenses."
          />
          <button
            type="button"
            className="action w-full"
            onClick={() => {
              void query.refetch();
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <DashboardHeaderCard
            owedToYouMinor={data.balance.owedToYouMinor}
            youOweMinor={data.balance.youOweMinor}
          />
          <DashboardExpenses expenses={data.activeExpenses} />
          <DashboardExpenses expenses={data.settledExpenses} settled />
        </>
      )}
      <Link
        href={dashboardRoutes.scan}
        aria-label="Scan receipt"
        className="fixed right-4 bottom-4 z-10 flex size-18 items-center justify-center rounded-full bg-dark-gradient text-on-dark shadow-lg"
      >
        <HugeiconsIcon icon={Scan} size={28} />
      </Link>
    </>
  );
}
