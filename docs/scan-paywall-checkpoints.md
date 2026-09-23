# AI receipt scan paywall: implementation checkpoints

This file is the resume point for the RevenueCat and Google Play launch. The code is present, but billing cannot be verified or enabled until store products and credentials exist.

## Product contract

- First **5 successful AI receipt scans** per Zius account are free. On-device OCR is free.
- Later successful AI scans cost **0.50 displayed credits** (50 integer `SCAN` units).
- Top-ups: `scan_credits_20` = ₱20 / 20 credits / 2,000 units; `scan_credits_55` = ₱50 / 55 credits / 5,500 units; `scan_credits_120` = ₱100 / 120 credits / 12,000 units. These are consumables and never expire.
- The monthly plan is ₱200 / **300 credits** / 30,000 units, granted at purchase and each renewal. Configure this grant to expire at the end of its billing cycle. No trial grant is planned.
- The current offering must include the plan as its **monthly** package. The three top-ups are loaded by product ID.
- Displayed prices come from Google Play through RevenueCat; verify they match the intended peso prices before launch.

## Completed in code

- `receipt.parse` enforces the free counter and checks RevenueCat balance, charges after a valid AI result, and stores successful results by request ID. Retrying the same ID cannot charge twice. Free attempts idle for over two minutes are released automatically.
- Empty or failed AI parses are not charged. If a payment result is uncertain, the attempt remains pending and a retry with the same ID uses RevenueCat's idempotency key.
- The native scan screen opens the credit screen when the server reports `PAYMENT_REQUIRED`; the credit screen has top-ups, monthly purchase, restore, and manage-subscription actions. Settings links to it.
- Migrations `packages/db/src/migrations/0003_confused_shotgun.sql` and `0004_petite_lockheed.sql` add the counter, attempt table, and lookup index. **Apply both before deploying the API.**

## Store and environment checkpoint

1. In Google Play Console, create and activate the three consumables above and an auto-renewing monthly subscription (`scan_plus_monthly`) with a ₱200 base plan. Upload an Android build and set up license testers/internal testing if the console requires it.
2. In RevenueCat, connect the Play app and service credentials. Create one in-app currency with code `SCAN`. Attach the three consumables and the subscription with the integer grants above. Enable expiration at the end of the billing cycle for the subscription grant. Make the monthly package available in the current offering.
   Set restore behavior to **Keep with original App User ID** if purchases must stay with the Zius account that paid. This setting can prevent a second Zius account using the same store account from buying; test that account-switching behavior before launch.
3. Set `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in the native build environment. Set `REVENUECAT_PROJECT_ID` and `REVENUECAT_SECRET_KEY` on the server. The secret key needs customer purchase read and write permissions; never place it in an `EXPO_PUBLIC_` variable. For iOS release, also create matching App Store products and set `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
4. Apply the migration to each deployed database using the repo's database migration command, then deploy the API and **build a new native binary**. Adding `react-native-purchases` cannot ship through an OTA update alone.

## Verification checkpoint

- Automated: `bun test packages/api/tests/receipt.test.ts`, `bun run check-types` for `packages/api` and `apps/native`.
- Android Play test build: confirm scans 1–5 are free; scan 6 opens credits; each pack grants the configured units; subscription grants 30,000 units; a successful paid scan deducts 50 units; empty/failed scans deduct none; a duplicate request ID does not charge twice.
- Test pending/cancelled purchases, restore on a second device, account switching, subscription renewal and expiration, top-up rollover, refunds, and no network during the scan. Confirm store prices and subscription disclosures on the real paywall.
- Inspect `receipt_scan` rows with `status = 'pending'` after interrupted requests. Free attempts are reclaimed after two minutes when the account checks its balance or scans again. The current client keeps the ID on connection errors while the image remains open; abandoned paid attempts need a support/reconciliation procedure before large-scale launch.

## Known limit

A balance can change between the precheck and the final RevenueCat deduction (for example, another device spends the last credits). RevenueCat rejects that final deduction and the scan result is not delivered. The model call still costs Zius in that rare race. Add a per-account scan queue only if this becomes a measurable issue.
