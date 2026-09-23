import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_SERVER_URL: z.url(),
    EXPO_PUBLIC_VERCEL_BYPASS_SECRET: z.string().min(1).optional(),
    EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: z.string().min(1).optional(),
    EXPO_PUBLIC_REVENUECAT_IOS_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    EXPO_PUBLIC_SERVER_URL: process.env.EXPO_PUBLIC_SERVER_URL,
    EXPO_PUBLIC_VERCEL_BYPASS_SECRET: process.env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET,
    EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    EXPO_PUBLIC_REVENUECAT_IOS_KEY: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  },
  emptyStringAsUndefined: true,
});
