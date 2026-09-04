import { z } from "zod";

const groupParticipantSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  email: z.email(),
  userId: z.string().optional(),
});

export const createGroupSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a group name"),
    participants: z.array(groupParticipantSchema).min(1, "Add at least one participant"),
  })
  .superRefine((input, ctx) => {
    const emails = new Set<string>();

    for (const [index, participant] of input.participants.entries()) {
      const email = participant.email.toLowerCase();

      if (emails.has(email)) {
        ctx.addIssue({
          code: "custom",
          message: "Each participant can only appear once",
          path: ["participants", index, "email"],
        });
      }

      emails.add(email);
    }
  });

export type GroupFormParticipant = z.infer<typeof groupParticipantSchema>;
export type GroupFormValues = z.infer<typeof createGroupSchema>;
