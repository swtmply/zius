import { env } from "@zius/env/native";
import Purchases from "react-native-purchases";
import { Platform } from "react-native";

let configured = false;
let pending = Promise.resolve();

export function ensureRevenueCat(userId: string) {
  const key =
    Platform.OS === "android"
      ? env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
      : env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  if (!key || Platform.OS === "web")
    throw new Error("Purchases are not configured for this device");
  pending = pending
    .catch(() => {})
    .then(async () => {
      if (!configured) {
        Purchases.configure({ apiKey: key, appUserID: userId });
        configured = true;
      } else if ((await Purchases.getAppUserID()) !== userId) {
        await Purchases.logIn(userId);
      }
    });
  return pending;
}
