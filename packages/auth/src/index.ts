import { expo } from "@better-auth/expo";
import { createDb } from "@zius/db";
import * as schema from "@zius/db/schema/auth";
import { participant } from "@zius/db/schema/billing";
import { env } from "@zius/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { eq } from "drizzle-orm";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",

      schema: schema,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const [existingParticipant] = await db
              .select({
                id: participant.id,
              })
              .from(participant)
              .where(eq(participant.email, user.email))
              .limit(1);

            if (existingParticipant) {
              await db
                .update(participant)
                .set({
                  userId: user.id,
                  name: user.name,
                  claimedAt: new Date(),
                })
                .where(eq(participant.id, existingParticipant.id));

              return;
            }

            await db.insert(participant).values({
              userId: user.id,
              name: user.name,
              email: user.email,
              claimedAt: new Date(),
            });
          },
        },
      },
    },
    trustedOrigins: [
      env.CORS_ORIGIN,

      "zius://",
      "exp://",
      "http://localhost:8081",
    ],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [expo(), openAPI()],
  });
}

export const auth = createAuth();
