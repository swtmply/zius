import { env } from "@zius/env/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, router } from "../index";

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

export const receiptRouter = router({
  parse: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().min(1).max(MAX_IMAGE_BASE64_LENGTH),
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).default("image/jpeg"),
      }),
    )
    .mutation(async ({ input }) => {
      if (!env.OPENAI_API_KEY) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Receipt parsing is not configured",
          cause: new Error("OPENAI_API_KEY is not set"),
        });
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
            format: { type: "json_schema", name: "receipt", strict: true, schema: RESPONSE_SCHEMA },
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

      return {
        items: parsed.data.items,
        totalMinor: parsed.data.totalMinor ?? undefined,
      };
    }),
});
