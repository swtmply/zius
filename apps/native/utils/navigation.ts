import { router as expoRouter } from "expo-router";

import { guardTap } from "@/utils/tap-guard";

/**
 * `expo-router`'s router with every navigating method tap guarded, so a double tap
 * cannot push the same screen twice or stack two screens. Reads such as `canGoBack`
 * and non-navigating calls such as `setParams` are passed through untouched.
 */
export const router = {
  ...expoRouter,
  push: guardTap(expoRouter.push),
  navigate: guardTap(expoRouter.navigate),
  replace: guardTap(expoRouter.replace),
  back: guardTap(expoRouter.back),
  dismiss: guardTap(expoRouter.dismiss),
  dismissTo: guardTap(expoRouter.dismissTo),
  dismissAll: guardTap(expoRouter.dismissAll),
};

export function useRouter() {
  return router;
}
