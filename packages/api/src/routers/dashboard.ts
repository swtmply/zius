import { user } from "@zius/db/schema/auth";
import { expense, expenseParticipant, group, participant } from "@zius/db/schema/expense";
import { and, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";

import { participantProcedure, router } from "../index";

const dashboardExpenseColumns = {
  id: expense.id,
  title: expense.title,
  totalMinor: expense.totalMinor,
  currency: expense.currency,
  occurredAt: expense.occurredAt,
  status: expense.status,
};

export const dashboardRouter = router({
  get: participantProcedure.query(async ({ ctx }) => {
    if (!ctx.participant) {
      return {
        balance: {
          owedToYouMinor: 0,
          youOweMinor: 0,
          netMinor: 0,
          currency: "PHP",
        },
        activeExpenses: [],
        recentExpenses: [],
        settledExpenses: [],
      };
    }

    const participantId = ctx.participant.id;

    const [owedToYou] = await ctx.db
      .select({
        amountMinor: sql<number>`coalesce(sum(${expenseParticipant.owedMinor}), 0)`,
      })
      .from(expenseParticipant)
      .innerJoin(expense, eq(expense.id, expenseParticipant.expenseId))
      .where(
        and(
          eq(expense.status, "active"),
          eq(expense.payerId, participantId),
          ne(expenseParticipant.participantId, participantId),
          eq(expenseParticipant.status, "unpaid"),
        ),
      );

    const [youOwe] = await ctx.db
      .select({
        amountMinor: sql<number>`coalesce(sum(${expenseParticipant.owedMinor}), 0)`,
      })
      .from(expenseParticipant)
      .innerJoin(expense, eq(expense.id, expenseParticipant.expenseId))
      .where(
        and(
          eq(expense.status, "active"),
          eq(expenseParticipant.participantId, participantId),
          ne(expense.payerId, participantId),
          eq(expenseParticipant.status, "unpaid"),
        ),
      );

    const involvedExpenseRows = await ctx.db
      .select({ expenseId: expenseParticipant.expenseId })
      .from(expenseParticipant)
      .where(eq(expenseParticipant.participantId, participantId));

    const involvedExpenseIds = involvedExpenseRows.map((row) => row.expenseId);
    const involvementCondition =
      involvedExpenseIds.length > 0
        ? or(eq(expense.payerId, participantId), inArray(expense.id, involvedExpenseIds))
        : eq(expense.payerId, participantId);
    const activeGroupCondition = or(isNull(expense.groupId), isNull(group.archivedAt));

    const activeExpenseRows = await ctx.db
      .select(dashboardExpenseColumns)
      .from(expense)
      .leftJoin(group, eq(group.id, expense.groupId))
      .where(and(eq(expense.status, "active"), involvementCondition, activeGroupCondition))
      .orderBy(desc(expense.occurredAt))
      .limit(10);

    const settledExpenseRows = await ctx.db
      .select(dashboardExpenseColumns)
      .from(expense)
      .leftJoin(group, eq(group.id, expense.groupId))
      .where(and(eq(expense.status, "settled"), involvementCondition, activeGroupCondition))
      .orderBy(desc(expense.occurredAt))
      .limit(10);

    const dashboardExpenseIds = [...activeExpenseRows, ...settledExpenseRows].map(
      (item) => item.id,
    );
    const dashboardParticipantRows =
      dashboardExpenseIds.length === 0
        ? []
        : await ctx.db
            .select({
              expenseId: expenseParticipant.expenseId,
              id: participant.id,
              name: participant.name,
              email: participant.email,
              image: user.image,
            })
            .from(expenseParticipant)
            .innerJoin(participant, eq(participant.id, expenseParticipant.participantId))
            .leftJoin(user, eq(user.id, participant.userId))
            .where(inArray(expenseParticipant.expenseId, dashboardExpenseIds));

    const participantsByExpenseId = new Map<
      string,
      Array<{ id: string; name: string; email: string; image: string | null }>
    >();

    for (const row of dashboardParticipantRows) {
      const current = participantsByExpenseId.get(row.expenseId) ?? [];
      current.push({ id: row.id, name: row.name, email: row.email, image: row.image });
      participantsByExpenseId.set(row.expenseId, current);
    }

    const activeExpenses = activeExpenseRows.map((item) => ({
      ...item,
      participants: participantsByExpenseId.get(item.id) ?? [],
    }));

    const recentExpenses = await ctx.db
      .select(dashboardExpenseColumns)
      .from(expense)
      .leftJoin(group, eq(group.id, expense.groupId))
      .where(and(involvementCondition, ne(expense.status, "cancelled"), activeGroupCondition))
      .orderBy(desc(expense.occurredAt))
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
      activeExpenses,
      recentExpenses,
      settledExpenses: settledExpenseRows.map((item) => ({
        ...item,
        participants: participantsByExpenseId.get(item.id) ?? [],
      })),
    };
  }),
});
