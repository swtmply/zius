import { db } from "@zius/db";
import { bill, billParticipant, participant } from "@zius/db/schema/billing";
import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";

import { protectedProcedure, router } from "../index";

const dashboardBillColumns = {
  id: bill.id,
  title: bill.title,
  totalMinor: bill.totalMinor,
  currency: bill.currency,
  occurredAt: bill.occurredAt,
  status: bill.status,
};

export const dashboardRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [currentParticipant] = await db
      .select({ id: participant.id })
      .from(participant)
      .where(eq(participant.userId, ctx.session.user.id))
      .limit(1);

    if (!currentParticipant) {
      return {
        balance: {
          owedToYouMinor: 0,
          youOweMinor: 0,
          netMinor: 0,
          currency: "PHP",
        },
        activeTransactions: [],
        recentTransactions: [],
      };
    }

    const participantId = currentParticipant.id;

    const [owedToYou] = await db
      .select({
        amountMinor: sql<number>`coalesce(sum(${billParticipant.owedMinor}), 0)`,
      })
      .from(billParticipant)
      .innerJoin(bill, eq(bill.id, billParticipant.billId))
      .where(
        and(
          eq(bill.status, "active"),
          eq(bill.payerId, participantId),
          ne(billParticipant.participantId, participantId),
          eq(billParticipant.status, "unpaid"),
        ),
      );

    const [youOwe] = await db
      .select({
        amountMinor: sql<number>`coalesce(sum(${billParticipant.owedMinor}), 0)`,
      })
      .from(billParticipant)
      .innerJoin(bill, eq(bill.id, billParticipant.billId))
      .where(
        and(
          eq(bill.status, "active"),
          eq(billParticipant.participantId, participantId),
          ne(bill.payerId, participantId),
          eq(billParticipant.status, "unpaid"),
        ),
      );

    const involvedBillRows = await db
      .select({ billId: billParticipant.billId })
      .from(billParticipant)
      .where(eq(billParticipant.participantId, participantId));

    const involvedBillIds = involvedBillRows.map((row) => row.billId);

    const activeTransactions = await db
      .select(dashboardBillColumns)
      .from(bill)
      .where(
        and(
          eq(bill.status, "active"),
          involvedBillIds.length > 0
            ? or(eq(bill.payerId, participantId), inArray(bill.id, involvedBillIds))
            : eq(bill.payerId, participantId),
        ),
      )
      .orderBy(desc(bill.occurredAt))
      .limit(10);

    const recentTransactions = await db
      .select(dashboardBillColumns)
      .from(bill)
      .where(
        and(
          eq(bill.status, "settled"),
          involvedBillIds.length > 0
            ? or(eq(bill.payerId, participantId), inArray(bill.id, involvedBillIds))
            : eq(bill.payerId, participantId),
        ),
      )
      .orderBy(desc(bill.occurredAt))
      .limit(5);

    const owedToYouMinor = Number(owedToYou?.amountMinor ?? 0);
    const youOweMinor = Number(youOwe?.amountMinor ?? 0);

    return {
      balance: {
        owedToYouMinor,
        youOweMinor,
        netMinor: owedToYouMinor - youOweMinor,
        currency: "PHP",
      },
      activeTransactions,
      recentTransactions,
    };
  }),
});
