import { expoClient, getSetCookie, storageAdapter } from "@better-auth/expo/client";
import { env } from "@zius/env/native";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const storagePrefix = Constants.expoConfig?.scheme as string;

export const authClient = createAuthClient({
  baseURL: new URL("/api/auth", env.EXPO_PUBLIC_SERVER_URL).toString(),
  fetchOptions: {
    headers: env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET }
      : undefined,
  },
  plugins: [
    expoClient({
      scheme: storagePrefix,
      storagePrefix,
      storage: SecureStore,
    }),
  ],
});

export async function persistAuthCookie(cookie: string) {
  const storage = storageAdapter(SecureStore);
  const key = `${storagePrefix}_cookie`;
  const currentCookie = await storage.getItemAsync(key);

  await storage.setItemAsync(key, getSetCookie(cookie, currentCookie ?? undefined));
}
