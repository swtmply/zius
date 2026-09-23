import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

function getVercelOrigin() {
  const vercelUrl =
    process.env.VERCEL_ENV === "production"
      ? (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL)
      : (process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (!vercelUrl) return undefined;
  return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
}

const vercelOrigin = getVercelOrigin();
const isVercelProductionOrPreview =
  process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
const appOrigin =
  process.env.VERCEL_ENV === "production"
    ? "https://www.tryzius.com"
    : process.env.VERCEL_ENV === "preview"
      ? "https://preview.tryzius.com"
      : (process.env.NODE_ENV ?? "development") === "development"
        ? "http://localhost:3000"
        : vercelOrigin;
// CORS compares an origin; Better Auth needs the endpoint path.
const authUrl = appOrigin ? `${appOrigin}/api/auth` : undefined;
const appVersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/, "Use a version like 1.2.3");

const runtimeEnv = {
  ...process.env,
  // Public auth base: /api/auth bypasses the rewrite's path strip, so the
  // same URL works for incoming matching and generated callbacks
  BETTER_AUTH_URL: isVercelProductionOrPreview ? authUrl : (process.env.BETTER_AUTH_URL ?? authUrl),
  CORS_ORIGIN: isVercelProductionOrPreview ? appOrigin : (process.env.CORS_ORIGIN ?? appOrigin),
  SERVER_PUBLIC_URL:
    process.env.SERVER_PUBLIC_URL ?? (vercelOrigin ? `${vercelOrigin}/api` : undefined),
};

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DATABASE_AUTH_TOKEN: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_ANDROID_CLIENT_ID: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    // Optional so deploys without receipt AI still boot; receipt.parse fails without it.
    OPENAI_API_KEY: z.string().min(1).optional(),
    REVENUECAT_PROJECT_ID: z.string().min(1).optional(),
    REVENUECAT_SECRET_KEY: z.string().min(1).optional(),
    CORS_ORIGIN: z.url(),
    SERVER_PUBLIC_URL: z.url().optional(),
    MOBILE_MINIMUM_IOS_VERSION: appVersionSchema.default("0.0.0"),
    MOBILE_MINIMUM_ANDROID_VERSION: appVersionSchema.default("0.0.0"),
    MOBILE_IOS_STORE_URL: z.url().optional(),
    MOBILE_ANDROID_STORE_URL: z.url().optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  },
  runtimeEnv: runtimeEnv,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
