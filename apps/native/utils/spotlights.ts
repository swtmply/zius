import * as SecureStore from "expo-secure-store";

const ALWAYS_SHOW_SPOTLIGHTS_STORAGE_KEY = "always-show-spotlights-on-load";
const ALWAYS_SHOW_ONBOARDING_PAGES_STORAGE_KEY = "always-show-onboarding-pages";

export function getAlwaysShowSpotlights() {
  return SecureStore.getItemAsync(ALWAYS_SHOW_SPOTLIGHTS_STORAGE_KEY).then(
    (value) => value === "true",
  );
}

export function setAlwaysShowSpotlights(enabled: boolean) {
  return SecureStore.setItemAsync(ALWAYS_SHOW_SPOTLIGHTS_STORAGE_KEY, String(enabled));
}

export function getAlwaysShowOnboardingPages() {
  return SecureStore.getItemAsync(ALWAYS_SHOW_ONBOARDING_PAGES_STORAGE_KEY).then(
    (value) => value === "true",
  );
}

export function setAlwaysShowOnboardingPages(enabled: boolean) {
  return SecureStore.setItemAsync(ALWAYS_SHOW_ONBOARDING_PAGES_STORAGE_KEY, String(enabled));
}
