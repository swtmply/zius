import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add,
  MoreHorizontal,
  TransactionHistoryIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";

import { formatCurrency } from "./format";
import { dashboardRoutes, withQuery } from "./routes";

const headerActions = [
  {
    label: "Transaction",
    accessibilityLabel: "Create transaction",
    icon: Add,
    href: dashboardRoutes.createExpense,
  },
  {
    label: "Groups",
    accessibilityLabel: "View groups",
    icon: UserGroup03Icon,
    href: withQuery(dashboardRoutes.groups, { sort: "newest", type: "all" }),
  },
  {
    label: "History",
    accessibilityLabel: "View history",
    icon: TransactionHistoryIcon,
    href: withQuery(dashboardRoutes.expenses, { sort: "newest", status: "active" }),
  },
  {
    label: "More",
    accessibilityLabel: "More settings",
    icon: MoreHorizontal,
    href: dashboardRoutes.settings,
  },
];

function BalanceMetric({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="min-w-0 flex-1 space-y-2 rounded-2xl bg-dark-gradient p-4">
      <p className="text-sm text-dark-supporting">{label}</p>
      <p className="truncate text-2xl font-semibold tabular-nums text-on-dark">
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

export function DashboardHeaderCard({
  owedToYouMinor,
  youOweMinor,
}: {
  owedToYouMinor: number;
  youOweMinor: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <BalanceMetric label="You owed" amount={youOweMinor} />
        <BalanceMetric label="You’re owed" amount={owedToYouMinor} />
      </div>

      <div className="panel flex items-start">
        {headerActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            aria-label={action.accessibilityLabel}
            className="flex flex-1 flex-col items-center gap-1 text-xs text-ink"
          >
            <span className="icon-button bg-page">
              <HugeiconsIcon icon={action.icon} size={24} />
            </span>
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
