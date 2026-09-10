import { z } from "zod";

export const splitMethods = ["equal", "fixed", "percentage", "items"] as const;

export type SplitMethod = (typeof splitMethods)[number];

const expenseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number(),
  priceMinor: z.number(),
  participantEmail: z.string().optional(),
});

export type ExpenseItem = z.infer<typeof expenseItemSchema>;

export const createExpenseSchema = z
  .object({
    totalMinor: z.number(),
    title: z.string(),
    splitMethod: z.enum(splitMethods),
    payer: z.email(),
    group_id: z.optional(z.string()),
    participants: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        userId: z.optional(z.string()),
        owedMinor: z.number(),
        splitValue: z.number(),
        isSplitValueEdited: z.boolean(),
        status: z.enum(["unpaid", "paid"]),
      }),
    ),
    items: z.array(expenseItemSchema).default([]),
    occurredAt: z.number(),
    currency: z.string().default("PHP"),
  })
  .superRefine((input, ctx) => {
    if (input.splitMethod !== "items") {
      return;
    }

    if (input.items.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Add at least one item",
        path: ["items"],
      });
      return;
    }

    let itemTotal = 0;
    let canCalculateTotal = true;

    for (const [index, item] of input.items.entries()) {
      if (!item.name.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Enter an item name",
          path: ["items", index, "name"],
        });
      }

      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Quantity must be a whole number greater than 0",
          path: ["items", index, "quantity"],
        });
      }

      if (!Number.isSafeInteger(item.priceMinor) || item.priceMinor < 0) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid nonnegative line total",
          path: ["items", index, "priceMinor"],
        });
      } else if (canCalculateTotal) {
        const nextTotal = itemTotal + item.priceMinor;

        if (!Number.isSafeInteger(nextTotal)) {
          canCalculateTotal = false;
        } else {
          itemTotal = nextTotal;
        }
      }

      if (!item.participantEmail?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Assign this item to a participant",
          path: ["items", index, "participantEmail"],
        });
      }
    }

    if (!canCalculateTotal) {
      ctx.addIssue({
        code: "custom",
        message: "Item totals are too large to calculate",
        path: ["items"],
      });
    } else if (itemTotal !== input.totalMinor) {
      ctx.addIssue({
        code: "custom",
        message: "Item total must match the expense amount",
        path: ["items"],
      });
    }
  });

export type ExpenseFormValues = z.input<typeof createExpenseSchema>;
export type FormParticipant = ExpenseFormValues["participants"][number];

export type ExpenseItemErrors = {
  name?: string;
  quantity?: string;
  priceMinor?: string;
  participantEmail?: string;
};

export function getExpenseItemErrors(item: ExpenseItem): ExpenseItemErrors {
  return {
    name: item.name.trim() ? undefined : "Enter an item name",
    quantity:
      Number.isSafeInteger(item.quantity) && item.quantity > 0
        ? undefined
        : "Quantity must be a whole number greater than 0",
    priceMinor:
      Number.isSafeInteger(item.priceMinor) && item.priceMinor >= 0
        ? undefined
        : "Enter a valid nonnegative line total",
    participantEmail: item.participantEmail?.trim()
      ? undefined
      : "Assign this item to a participant",
  };
}

export function sumExpenseItemPrices(items: ExpenseItem[]): number | undefined {
  let total = 0;

  for (const item of items) {
    if (!Number.isSafeInteger(item.priceMinor) || item.priceMinor < 0) {
      return undefined;
    }

    total += item.priceMinor;

    if (!Number.isSafeInteger(total)) {
      return undefined;
    }
  }

  return total;
}

export function createExpenseItem(
  item: Pick<ExpenseItem, "name" | "quantity" | "priceMinor"> &
    Partial<Pick<ExpenseItem, "participantEmail">>,
  id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
): ExpenseItem {
  return {
    id,
    name: item.name,
    quantity: item.quantity,
    priceMinor: item.priceMinor,
    participantEmail: item.participantEmail?.toLowerCase(),
  };
}

export function clearInvalidItemAssignments(
  items: ExpenseItem[],
  participants: FormParticipant[],
): ExpenseItem[] {
  const participantEmails = new Set(
    participants.map((participant) => participant.email.toLowerCase()),
  );

  return items.map((item) => {
    const participantEmail = item.participantEmail?.toLowerCase();

    return participantEmail && participantEmails.has(participantEmail)
      ? { ...item, participantEmail }
      : { ...item, participantEmail: undefined };
  });
}

function divideEvenly(total: number, count: number) {
  if (count === 0) {
    return [];
  }

  const baseAmount = Math.floor(total / count);
  const remainder = total % count;

  return Array.from({ length: count }, (_, index) => baseAmount + (index < remainder ? 1 : 0));
}

export function recalculateParticipants(
  participants: FormParticipant[],
  totalMinor: number,
  splitMethod: SplitMethod,
  items: ExpenseItem[] = [],
) {
  const participantIds = participants.map((participant) => participant.id);

  if (splitMethod === "items") {
    const amountsByEmail = new Map<string, number>();

    for (const item of items) {
      const participantEmail = item.participantEmail?.toLowerCase();

      if (!participantEmail || !Number.isSafeInteger(item.priceMinor) || item.priceMinor < 0) {
        continue;
      }

      const currentAmount = amountsByEmail.get(participantEmail) ?? 0;
      const nextAmount = currentAmount + item.priceMinor;

      if (Number.isSafeInteger(nextAmount)) {
        amountsByEmail.set(participantEmail, nextAmount);
      }
    }

    return participants.map((participant) => ({
      ...participant,
      owedMinor: amountsByEmail.get(participant.email.toLowerCase()) ?? 0,
      splitValue: 0,
      isSplitValueEdited: false,
    }));
  }

  if (splitMethod === "equal") {
    const shares = divideEvenly(totalMinor, participantIds.length);
    const sharesById = new Map(participantIds.map((id, index) => [id, shares[index] ?? 0]));

    return participants.map((participant) => ({
      ...participant,
      owedMinor: sharesById.get(participant.id) ?? 0,
      splitValue: sharesById.get(participant.id) ?? 0,
      isSplitValueEdited: false,
    }));
  }

  const editedParticipants = participants.filter((participant) => participant.isSplitValueEdited);
  const automaticParticipantIds = participantIds.filter(
    (id) => !editedParticipants.some((participant) => participant.id === id),
  );

  if (splitMethod === "fixed") {
    const editedTotal = editedParticipants.reduce(
      (total, participant) => total + participant.splitValue,
      0,
    );
    const automaticShares = divideEvenly(
      Math.max(0, totalMinor - editedTotal),
      automaticParticipantIds.length,
    );
    const automaticSharesById = new Map(
      automaticParticipantIds.map((id, index) => [id, automaticShares[index] ?? 0]),
    );

    return participants.map((participant) => {
      if (participant.isSplitValueEdited) {
        return { ...participant, owedMinor: participant.splitValue };
      }

      const splitValue = automaticSharesById.get(participant.id) ?? 0;
      return { ...participant, owedMinor: splitValue, splitValue };
    });
  }

  const editedPercentage = editedParticipants.reduce(
    (total, participant) => total + participant.splitValue,
    0,
  );
  const automaticPercentage =
    automaticParticipantIds.length === 0
      ? 0
      : Math.max(0, 100 - editedPercentage) / automaticParticipantIds.length;
  const editedAmounts = new Map(
    editedParticipants.map((participant) => [
      participant.id,
      Math.round((totalMinor * participant.splitValue) / 100),
    ]),
  );
  const editedAmountTotal = [...editedAmounts.values()].reduce(
    (total, amount) => total + amount,
    0,
  );
  const automaticAmounts = divideEvenly(
    Math.max(0, totalMinor - editedAmountTotal),
    automaticParticipantIds.length,
  );
  const automaticAmountsById = new Map(
    automaticParticipantIds.map((id, index) => [id, automaticAmounts[index] ?? 0]),
  );

  return participants.map((participant) => {
    if (participant.isSplitValueEdited) {
      return {
        ...participant,
        owedMinor: editedAmounts.get(participant.id) ?? 0,
      };
    }

    return {
      ...participant,
      owedMinor: automaticAmountsById.get(participant.id) ?? 0,
      splitValue: automaticPercentage,
    };
  });
}
