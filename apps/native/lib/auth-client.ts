import { expoClient } from "@better-auth/expo/client";
import { env } from "@zius/env/native";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: new URL("/api/auth", env.EXPO_PUBLIC_SERVER_URL).toString(),
  fetchOptions: {
    headers: env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET }
      : undefined,
  },
  plugins: [
    expoClient({
      scheme: Constants.expoConfig?.scheme as string,
      storagePrefix: Constants.expoConfig?.scheme as string,
      storage: SecureStore,
    }),
  ],
});
