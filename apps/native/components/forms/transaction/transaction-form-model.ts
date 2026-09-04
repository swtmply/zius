import { z } from "zod";

export const splitMethods = ["equal", "fixed", "percentage"] as const;

export type SplitMethod = (typeof splitMethods)[number];

export const createTransactionSchema = z.object({
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
  occurredAt: z.number(),
  currency: z.string().default("PHP"),
});

export type TransactionFormValues = z.input<typeof createTransactionSchema>;
export type FormParticipant = TransactionFormValues["participants"][number];

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
) {
  const participantIds = participants.map((participant) => participant.id);

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
