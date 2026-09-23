import { authClient } from "@/lib/auth-client";
import { ensureRevenueCat } from "@/utils/revenuecat";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "@/utils/navigation";
import { ChevronLeft } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Purchases, {
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from "react-native-purchases";
import { Button, Skeleton, Typography } from "heroui-native";

const PACKS = [
  { id: "scan_credits_20", credits: 20 },
  { id: "scan_credits_55", credits: 55 },
  { id: "scan_credits_120", credits: 120 },
] as const;

export default function ScanCredits() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = authClient.useSession();
  const allowance = useQuery({
    ...trpc.receipt.allowance.queryOptions(),
    refetchOnMount: "always",
  });
  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [monthly, setMonthly] = useState<PurchasesPackage | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user.id) return;
    let active = true;
    void ensureRevenueCat(session.user.id)
      .then(async () => {
        const [storeProducts, offerings, customer] = await Promise.all([
          Purchases.getProducts(
            PACKS.map((pack) => pack.id),
            Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION,
          ),
          Purchases.getOfferings(),
          Purchases.getCustomerInfo(),
        ]);
        if (active) {
          setProducts(storeProducts);
          setMonthly(offerings.current?.monthly ?? null);
          setSubscribed(customer.activeSubscriptions.includes("scan_plus_monthly"));
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load purchases");
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id]);

  const finishPurchase = async (purchase: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      if (!session?.user.id) throw new Error("Sign in to buy credits");
      await ensureRevenueCat(session.user.id);
      await purchase();
      const refresh = await Promise.allSettled([
        Purchases.getCustomerInfo().then((customer) =>
          setSubscribed(customer.activeSubscriptions.includes("scan_plus_monthly")),
        ),
        Purchases.invalidateVirtualCurrenciesCache().then(() => allowance.refetch()),
      ]);
      if (refresh.some((result) => result.status === "rejected")) {
        setError("Balance may take a moment to update. Tap Retry balance.");
      }
    } catch (cause) {
      if (
        !(cause && typeof cause === "object" && "userCancelled" in cause && cause.userCancelled)
      ) {
        setError(cause instanceof Error ? cause.message : "Purchase did not complete. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-page" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-4 py-4">
        <Button
          isIconOnly
          variant="ghost"
          accessibilityLabel="Back to scan"
          onPress={() => router.back()}
        >
          <Icon icon={ChevronLeft} size={24} colorClassName="accent-ink" />
        </Button>
        <Typography className="text-2xl font-semibold text-ink">AI scan credits</Typography>
      </View>
      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-8"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View className="rounded-2xl bg-panel p-4 gap-1">
          <Typography className="text-sm text-muted">Available for AI scans</Typography>
          {allowance.isLoading ? (
            <Skeleton className="h-8 w-36 rounded-lg" />
          ) : (
            <Typography className="text-2xl font-semibold text-ink">
              {allowance.data
                ? `${(allowance.data.balanceUnits / 100).toFixed(2)} credits`
                : "Balance unavailable"}
            </Typography>
          )}
          <Typography className="text-xs text-muted">
            {allowance.data
              ? `${allowance.data.freeScansRemaining} free scans left · 0.50 credits per AI scan`
              : "Your free scans and credits are tied to your account."}
          </Typography>
        </View>
        <View className="gap-2">
          <Typography className="text-sm font-semibold text-ink">Monthly plan</Typography>
          <View className="rounded-2xl bg-panel p-4 gap-2">
            <Typography className="text-sm font-semibold text-ink">
              300 credits each billing cycle
            </Typography>
            <Typography className="text-xs text-muted">
              Unused monthly credits expire at renewal. Top-up credits stay available.
            </Typography>
            <Typography className="text-xs text-muted">
              Renews automatically at the store price. Cancel anytime in your store subscriptions.
            </Typography>
            {subscribed ? (
              <Typography className="text-sm font-semibold text-ink">
                Your monthly plan is active
              </Typography>
            ) : monthly ? (
              <Button
                isDisabled={busy}
                onPress={() => void finishPurchase(() => Purchases.purchasePackage(monthly))}
              >
                <Button.Label>Subscribe · {monthly.product.priceString}/month</Button.Label>
              </Button>
            ) : (
              <Typography className="text-xs text-muted">
                {loadingProducts ? "Loading plan…" : "Plan unavailable"}
              </Typography>
            )}
          </View>
        </View>
        <View className="gap-2">
          <Typography className="text-sm font-semibold text-ink">Top up anytime</Typography>
          {PACKS.map((pack) => {
            const product = products.find((item) => item.identifier === pack.id);
            return (
              <View
                key={pack.id}
                className="rounded-2xl bg-panel p-4 flex-row items-center justify-between gap-4"
              >
                <View className="flex-1 gap-1">
                  <Typography className="text-sm font-semibold text-ink">
                    {pack.credits} credits
                  </Typography>
                  <Typography className="text-xs text-muted">
                    {pack.credits * 2} AI scans · never expire
                  </Typography>
                </View>
                {product ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busy}
                    onPress={() =>
                      void finishPurchase(() => Purchases.purchaseStoreProduct(product))
                    }
                  >
                    <Button.Label>{product.priceString}</Button.Label>
                  </Button>
                ) : (
                  <Typography className="text-xs text-muted">
                    {loadingProducts ? "Loading…" : "Unavailable"}
                  </Typography>
                )}
              </View>
            );
          })}
        </View>
        {error ? (
          <Typography className="text-xs text-danger" accessibilityLiveRegion="polite">
            {error}
          </Typography>
        ) : null}
        <Button variant="secondary" onPress={() => void allowance.refetch()}>
          <Button.Label>{allowance.isError ? "Retry balance" : "Refresh balance"}</Button.Label>
        </Button>
        <Button
          variant="ghost"
          isDisabled={busy || loadingProducts}
          onPress={() => void finishPurchase(() => Purchases.restorePurchases())}
        >
          <Button.Label>Restore purchases</Button.Label>
        </Button>
        <Button
          variant="ghost"
          isDisabled={busy || loadingProducts}
          onPress={() => {
            void Purchases.showManageSubscriptions().catch(() =>
              setError("Could not open subscription management."),
            );
          }}
        >
          <Button.Label>Manage subscription</Button.Label>
        </Button>
      </ScrollView>
    </View>
  );
}
