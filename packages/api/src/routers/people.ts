import { person } from "@zius/db/schema/expenses";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type { Context } from "../context";
import { protectedProcedure, router } from "../index";
import { personSchema } from "./schemas";

type AuthenticatedSession = NonNullable<Context["session"]>;
type Person = typeof person.$inferSelect;

async function findPersonByUserId(db: Context["db"], userId: string) {
  const [match] = await db.select().from(person).where(eq(person.userId, userId)).limit(1);
  return match;
}

async function findPersonByEmail(db: Context["db"], emailNormalized: string) {
  const [match] = await db
    .select()
    .from(person)
    .where(eq(person.emailNormalized, emailNormalized))
    .limit(1);
  return match;
}

function currentPersonCreationError(emailMatch: Person | undefined) {
  if (emailMatch?.userId === null) {
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "The account email belongs to an existing guest",
    });
  }

  return new TRPCError({
    code: "CONFLICT",
    message: emailMatch
      ? "The account email belongs to another person"
      : "Could not create the current person",
  });
}

function toPublicPerson(resolvedPerson: Person) {
  return {
    id: resolvedPerson.id,
    displayName: resolvedPerson.displayName,
    email: resolvedPerson.emailNormalized,
  };
}

export async function getOrCreateCurrentPerson(db: Context["db"], session: AuthenticatedSession) {
  const linkedPerson = await findPersonByUserId(db, session.user.id);

  if (linkedPerson) {
    return linkedPerson;
  }

  const emailNormalized = session.user.email.trim().toLowerCase();
  const emailMatch = await findPersonByEmail(db, emailNormalized);

  if (emailMatch) {
    throw currentPersonCreationError(emailMatch);
  }

  const [createdPerson] = await db
    .insert(person)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      displayName: session.user.name,
      emailNormalized,
      createdByUserId: session.user.id,
      claimedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (createdPerson) {
    return createdPerson;
  }

  const concurrentLinkedPerson = await findPersonByUserId(db, session.user.id);

  if (concurrentLinkedPerson) {
    return concurrentLinkedPerson;
  }

  throw currentPersonCreationError(await findPersonByEmail(db, emailNormalized));
}

export const peopleRouter = router({
  resolve: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/people/resolve",
        tags: ["People"],
        summary: "Resolve an email to a person",
        description:
          "Returns the person already registered for the email, creating a guest when none exists.",
      },
    })
    .input(
      z.object({
        email: z.string().trim().toLowerCase().email(),
        displayName: z.string().trim().min(1),
      }),
    )
    .output(personSchema)
    .mutation(async ({ ctx, input }) => {
      await getOrCreateCurrentPerson(ctx.db, ctx.session);

      const existingPerson = await findPersonByEmail(ctx.db, input.email);

      if (existingPerson) {
        return toPublicPerson(existingPerson);
      }

      const [guest] = await ctx.db
        .insert(person)
        .values({
          id: crypto.randomUUID(),
          displayName: input.displayName,
          emailNormalized: input.email,
          createdByUserId: ctx.session.user.id,
        })
        .onConflictDoNothing({ target: person.emailNormalized })
        .returning();

      if (guest) {
        return toPublicPerson(guest);
      }

      const concurrentGuest = await findPersonByEmail(ctx.db, input.email);

      if (!concurrentGuest) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Could not resolve the email to a person",
        });
      }

      return toPublicPerson(concurrentGuest);
    }),
});
