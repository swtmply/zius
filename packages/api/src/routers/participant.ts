import { z } from "zod";

import { participantProcedure, requireParticipant, router } from "../index";

const currentParticipantOutputSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  userId: z.string(),
});

export const participantRouter = router({
  current: participantProcedure
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
      const currentParticipant = requireParticipant(ctx.participant);

      return {
        ...currentParticipant,
        userId: ctx.session.user.id,
      };
    }),
});
