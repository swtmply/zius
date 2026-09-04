import { db } from "@zius/db";
import { participant } from "@zius/db/schema/billing";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

const currentParticipantOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  userId: z.string(),
});

export const participantRouter = router({
  current: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/participants/current",
        protect: true,
        tags: ["Participants"],
        summary: "Get the current participant",
        errorResponses: [401, 403, 404, 500],
      },
    })
    .input(z.void())
    .output(currentParticipantOutputSchema)
    .query(async ({ ctx }) => {
      const [currentParticipant] = await db
        .select({
          id: participant.id,
          name: participant.name,
          email: participant.email,
        })
        .from(participant)
        .where(eq(participant.userId, ctx.session.user.id))
        .limit(1);

      if (!currentParticipant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Current participant not found",
        });
      }

      return {
        ...currentParticipant,
        userId: ctx.session.user.id,
      };
    }),
});
