import { expo } from "@better-auth/expo";
import { createDb } from "@zius/db";
import * as schema from "@zius/db/schema/auth";
import { participant } from "@zius/db/schema/expense";
import { env } from "@zius/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { openAPI } from "better-auth/plugins";
import { eq } from "drizzle-orm";

import { sendVerificationEmail } from "./email";

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
      // Expo dev client origins, kept out of production
      ...(env.NODE_ENV === "production" ? [] : ["exp://", "http://localhost:8081"]),
    ],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      expiresIn: 60 * 60,
      sendOnSignIn: true,
      sendVerificationEmail: ({ user, url }) =>
        sendVerificationEmail({
          apiKey: env.RESEND_API_KEY,
          email: user.email,
          url,
        }),
    },
    // On top of better-auth's production default (100 req / 10s per IP across
    // all auth paths), throttle the credential endpoints a brute force targets.
    // ponytail: memory store, so the limit is per serverless instance — move to
    // `storage: "database"` (adds a rateLimit table) if that proves too leaky.
    rateLimit: {
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
        "/forget-password": { window: 60, max: 3 },
        "/reset-password": { window: 60, max: 5 },
      },
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
