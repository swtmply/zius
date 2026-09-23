import { env } from "@zius/env/server";
import type { Database } from "@zius/db";
import { user } from "@zius/db/schema/auth";
import { receiptScan } from "@zius/db/schema/receipt-scan";
import { TRPCError } from "@trpc/server";
import { and, eq, lt, ne, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { z } from "zod";

import { protectedProcedure, router } from "../index";
import {
  adjustCredits,
  CreditsConfigurationError,
  CreditsUnavailableError,
  getCredits,
  SCAN_PRICE_UNITS,
} from "../revenuecat";

const MODEL = "gpt-6-luna";

// Roughly 3 MB of JPEG once base64 is decoded; the client resizes well below this.
const MAX_IMAGE_BASE64_LENGTH = 4_000_000;

const PROMPT = `Extract the purchased line items from this receipt photo.
- One entry per purchased line. Skip subtotal, VAT, tax, service charge, discounts, cash, change and tendered rows.
- quantity is the number of units bought on that line (1 when not shown).
- priceMinor is the line total (not the unit price) in minor units, e.g. 125.50 becomes 12550.
- totalMinor is the grand total / amount due in minor units, or null when it is not visible.
- If the image is not a receipt, return no items and a null total.`;

export const parsedReceiptSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().trim().min(1),
      quantity: z.number().int().positive(),
      priceMinor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    }),
  ),
  totalMinor: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).nullable(),
});

// Structured outputs in strict mode: every property required, no extras.
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items", "totalMinor"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity", "priceMinor"],
        properties: {
          name: { type: "string" },
          quantity: { type: "integer" },
          priceMinor: { type: "integer" },
        },
      },
    },
    totalMinor: { type: ["integer", "null"] },
  },
};

type ResponsesApiOutput = {
  output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
};

async function reclaimStaleFreeScans(db: Database, userId: string, excludeId?: string) {
  const staleBefore = new Date(Date.now() - 120_000);
  const stale = await db
    .select({ id: receiptScan.id })
    .from(receiptScan)
    .where(
      and(
        eq(receiptScan.userId, userId),
        eq(receiptScan.status, "pending"),
        eq(receiptScan.source, "free"),
        lt(receiptScan.updatedAt, staleBefore),
        excludeId ? ne(receiptScan.id, excludeId) : undefined,
      ),
    );
  for (const { id } of stale) {
    await db.transaction(async (tx) => {
      const [claimed] = await tx
        .update(receiptScan)
        .set({ status: "failed", updatedAt: new Date() })
        .where(
          and(
            eq(receiptScan.id, id),
            eq(receiptScan.status, "pending"),
            lt(receiptScan.updatedAt, staleBefore),
          ),
        )
        .returning({ id: receiptScan.id });
      if (claimed) {
        await tx
          .update(user)
          .set({ freeAiScansUsed: sql`${user.freeAiScansUsed} - 1` })
          .where(eq(user.id, userId));
      }
    });
  }
}

export const receiptRouter = router({
  allowance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    await reclaimStaleFreeScans(ctx.db, userId);
    const [account] = await ctx.db
      .select({ used: user.freeAiScansUsed })
      .from(user)
      .where(eq(user.id, userId));
    let balanceUnits = 0;
    try {
      balanceUnits = await getCredits(userId);
    } catch (error) {
      if (!(error instanceof CreditsConfigurationError)) throw error;
    }
    return { freeScansRemaining: Math.max(0, 5 - (account?.used ?? 0)), balanceUnits };
  }),
  parse: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().min(1).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
        requestId: z.string().min(8).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Receipt parsing is not configured",
          cause: new Error("OPENAI_API_KEY is not set"),
        });
      }

      const userId = ctx.session.user.id;
      await reclaimStaleFreeScans(ctx.db, userId, input.requestId);
      const imageHash = createHash("sha256").update(input.imageBase64).digest("hex");
      const now = new Date();
      const [created] = await ctx.db
        .insert(receiptScan)
        .values({
          id: input.requestId,
          userId,
          imageHash,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing()
        .returning({ id: receiptScan.id });
      if (!created) {
        const [previous] = await ctx.db
          .select()
          .from(receiptScan)
          .where(eq(receiptScan.id, input.requestId));
        if (!previous || previous.userId !== userId || previous.imageHash !== imageHash) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Scan request ID was reused" });
        }
        if (previous.status === "succeeded" && previous.result) {
          return JSON.parse(previous.result) as {
            items: z.infer<typeof parsedReceiptSchema>["items"];
            totalMinor?: number;
          };
        }
        if (previous.status === "failed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "This scan failed. Try again." });
        }
        // ponytail: a stale request may repeat the AI call; the final charge is idempotent.
        const [claimed] = await ctx.db
          .update(receiptScan)
          .set({ updatedAt: now })
          .where(
            and(
              eq(receiptScan.id, input.requestId),
              lt(receiptScan.updatedAt, new Date(now.getTime() - 120_000)),
            ),
          )
          .returning({ id: receiptScan.id });
        if (!claimed)
          throw new TRPCError({ code: "CONFLICT", message: "Scan is still processing" });
      }

      let [attempt] = await ctx.db
        .select()
        .from(receiptScan)
        .where(eq(receiptScan.id, input.requestId));
      if (!attempt)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Scan reservation failed" });
      let chargeAttempted = false;
      try {
        if (!attempt?.source) {
          const source = await ctx.db.transaction(async (tx) => {
            const [reserved] = await tx
              .update(user)
              .set({ freeAiScansUsed: sql`${user.freeAiScansUsed} + 1` })
              .where(and(eq(user.id, userId), lt(user.freeAiScansUsed, 5)))
              .returning({ id: user.id });
            const choice = reserved ? "free" : "credits";
            await tx
              .update(receiptScan)
              .set({ source: choice })
              .where(eq(receiptScan.id, input.requestId));
            return choice;
          });
          attempt.source = source;
        }
        if (attempt.source === "credits") {
          if ((await getCredits(userId)) < SCAN_PRICE_UNITS) {
            throw new CreditsUnavailableError("Not enough credits");
          }
        }

        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: MODEL,
            reasoning: { effort: "low" },
            input: [
              {
                role: "user",
                content: [
                  { type: "input_text", text: PROMPT },
                  {
                    type: "input_image",
                    image_url: `data:${input.mimeType};base64,${input.imageBase64}`,
                    detail: "high",
                  },
                ],
              },
            ],
            text: {
              format: {
                type: "json_schema",
                name: "receipt",
                strict: true,
                schema: RESPONSE_SCHEMA,
              },
            },
          }),
          signal: AbortSignal.timeout(45_000),
        });

        if (!response.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to parse receipt",
            cause: new Error(`OpenAI ${response.status}: ${await response.text()}`),
          });
        }

        const data = (await response.json()) as ResponsesApiOutput;
        const text = data.output
          ?.find((item) => item.type === "message")
          ?.content?.find((part) => part.type === "output_text")?.text;

        // Model output is untrusted: re-validate before it reaches the expense form.
        const parsed = text ? parsedReceiptSchema.safeParse(JSON.parse(text)) : undefined;
        if (!parsed?.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to parse receipt",
            cause: new Error(`Unexpected OpenAI output: ${text ?? "none"}`),
          });
        }
        if (parsed.data.items.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No receipt items found" });
        }

        const result = {
          items: parsed.data.items,
          totalMinor: parsed.data.totalMinor ?? undefined,
        };
        if (attempt.source === "credits") {
          chargeAttempted = true;
          await adjustCredits(userId, -SCAN_PRICE_UNITS, `${input.requestId}:charge`);
        }
        await ctx.db
          .update(receiptScan)
          .set({ status: "succeeded", result: JSON.stringify(result), updatedAt: new Date() })
          .where(eq(receiptScan.id, input.requestId));
        return result;
      } catch (error) {
        if (error instanceof CreditsUnavailableError) {
          await ctx.db
            .update(receiptScan)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(receiptScan.id, input.requestId));
          throw new TRPCError({
            code: "PAYMENT_REQUIRED",
            message: "Not enough credits for an AI scan",
          });
        }
        if (error instanceof CreditsConfigurationError) {
          await ctx.db
            .update(receiptScan)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(receiptScan.id, input.requestId));
          throw new TRPCError({
            code: "SERVICE_UNAVAILABLE",
            message: "Purchases are not configured",
          });
        }
        // An unknown payment outcome must be retried with the same idempotency key.
        if (chargeAttempted) {
          try {
            await ctx.db
              .update(receiptScan)
              .set({ updatedAt: new Date(0) })
              .where(eq(receiptScan.id, input.requestId));
          } catch {
            // The original attempt remains available for recovery after its timeout.
          }
          throw new TRPCError({
            code: "CONFLICT",
            message: "Scan is pending. Try again.",
            cause: error,
          });
        }
        if (attempt?.source === "free") {
          await ctx.db.transaction(async (tx) => {
            await tx
              .update(user)
              .set({ freeAiScansUsed: sql`${user.freeAiScansUsed} - 1` })
              .where(eq(user.id, userId));
            await tx
              .update(receiptScan)
              .set({ status: "failed", updatedAt: new Date() })
              .where(eq(receiptScan.id, input.requestId));
          });
        } else {
          await ctx.db
            .update(receiptScan)
            .set({ status: "failed", updatedAt: new Date() })
            .where(eq(receiptScan.id, input.requestId));
        }
        throw error;
      }
    }),
});
