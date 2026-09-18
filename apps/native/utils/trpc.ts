import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@zius/api/routers/index";
import { env } from "@zius/env/native";
import { Platform } from "react-native";

import { authClient } from "@/lib/auth-client";

export const queryClient = new QueryClient();

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${env.EXPO_PUBLIC_SERVER_URL}/trpc`,
      fetch: function (url, options) {
        return fetch(url, {
          ...options,
          // Better Auth Expo forwards the session cookie manually on native.
          credentials: Platform.OS === "web" ? "include" : "omit",
        });
      },
      async headers() {
        const headers = new Map<string, string>();
        if (env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET) {
          headers.set("x-vercel-protection-bypass", env.EXPO_PUBLIC_VERCEL_BYPASS_SECRET);
        }
        if (Platform.OS === "web") {
          return Object.fromEntries(headers);
        }
        const cookies = await authClient.getCookie();
        if (cookies) {
          headers.set("Cookie", cookies);
        }
        return Object.fromEntries(headers);
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
