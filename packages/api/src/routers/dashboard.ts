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
    const involvementCondition =
      involvedBillIds.length > 0
        ? or(eq(bill.payerId, participantId), inArray(bill.id, involvedBillIds))
        : eq(bill.payerId, participantId);

    const activeBills = await db
      .select(dashboardBillColumns)
      .from(bill)
      .where(and(eq(bill.status, "active"), involvementCondition))
      .orderBy(desc(bill.occurredAt))
      .limit(10);

    const activeBillIds = activeBills.map((item) => item.id);
    const activeParticipantRows =
      activeBillIds.length === 0
        ? []
        : await db
            .select({
              billId: billParticipant.billId,
              id: participant.id,
              name: participant.name,
              email: participant.email,
            })
            .from(billParticipant)
            .innerJoin(
              participant,
              eq(participant.id, billParticipant.participantId),
            )
            .where(inArray(billParticipant.billId, activeBillIds));

    const participantsByBillId = new Map<
      string,
      Array<{ id: string; name: string; email: string }>
    >();

    for (const row of activeParticipantRows) {
      const current = participantsByBillId.get(row.billId) ?? [];
      current.push({ id: row.id, name: row.name, email: row.email });
      participantsByBillId.set(row.billId, current);
    }

    const activeTransactions = activeBills.map((item) => ({
      ...item,
      participants: participantsByBillId.get(item.id) ?? [],
    }));

    const recentTransactions = await db
      .select(dashboardBillColumns)
      .from(bill)
      .where(involvementCondition)
      .orderBy(desc(bill.occurredAt))
      .limit(10);

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
