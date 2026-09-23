import { env } from "@zius/env/server";

const CURRENCY = "SCAN";
export const SCAN_PRICE_UNITS = 50;

export class CreditsUnavailableError extends Error {}
export class CreditsConfigurationError extends Error {}

function customerUrl(userId: string) {
  if (!env.REVENUECAT_PROJECT_ID || !env.REVENUECAT_SECRET_KEY) {
    throw new CreditsConfigurationError("Purchases are not configured");
  }
  return `https://api.revenuecat.com/v2/projects/${encodeURIComponent(env.REVENUECAT_PROJECT_ID)}/customers/${encodeURIComponent(userId)}/virtual_currencies`;
}

export async function getCredits(userId: string) {
  const response = await fetch(customerUrl(userId), {
    headers: { Authorization: `Bearer ${env.REVENUECAT_SECRET_KEY}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return 0;
  if (!response.ok) throw new Error(`RevenueCat balance: ${response.status}`);
  const data = (await response.json()) as { items?: { currency_code: string; balance: number }[] };
  return data.items?.find((item) => item.currency_code === CURRENCY)?.balance ?? 0;
}

export async function adjustCredits(userId: string, amount: number, key: string) {
  const response = await fetch(`${customerUrl(userId)}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.REVENUECAT_SECRET_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": key,
    },
    body: JSON.stringify({ adjustments: { [CURRENCY]: amount } }),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 422 && amount < 0)
    throw new CreditsUnavailableError("Not enough credits");
  if (!response.ok) throw new Error(`RevenueCat transaction: ${response.status}`);
}
