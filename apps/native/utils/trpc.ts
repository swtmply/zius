import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import type { AppRouter } from "@zius/api/routers/index";
import { env } from "@zius/env/native";
import * as Network from "expo-network";
import { AppState, Platform } from "react-native";

import { authClient } from "@/lib/auth-client";

const QUERY_CACHE_MAX_AGE = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: QUERY_CACHE_MAX_AGE,
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "zius-query-cache",
});

export async function clearPersistedQueryCache() {
  queryClient.clear();
  try {
    await queryPersister.removeClient();
  } catch {
    console.warn("Could not clear the offline query cache");
  }
}

export const queryPersistOptions = {
  persister: queryPersister,
  maxAge: QUERY_CACHE_MAX_AGE,
  buster: "v1",
  dehydrateOptions: {
    // Mutation functions cannot be serialized. Offline writes resume while the app stays open.
    shouldDehydrateMutation: () => false,
  },
};

if (Platform.OS !== "web") {
  onlineManager.setEventListener((setOnline) => {
    const updateOnlineState = (state: Network.NetworkState) => {
      setOnline(state.isInternetReachable ?? state.isConnected ?? true);
    };

    void Network.getNetworkStateAsync()
      .then(updateOnlineState)
      .catch(() => setOnline(true));
    const subscription = Network.addNetworkStateListener(updateOnlineState);

    return () => subscription.remove();
  });

  focusManager.setEventListener((setFocused) => {
    setFocused(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (status) => {
      setFocused(status === "active");
    });

    return () => subscription.remove();
  });
}

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
