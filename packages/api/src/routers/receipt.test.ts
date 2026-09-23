import { expect, mock, spyOn, test } from "bun:test";

import type { Context } from "../context";
import { createCallerFactory } from "../index";

mock.module("@zius/env/server", () => ({ env: { OPENAI_API_KEY: "test-key" } }));
const { receiptRouter } = await import("./receipt");

const caller = createCallerFactory(receiptRouter)({
  session: { user: { id: "user_1", emailVerified: true } },
} as unknown as Context);

function respondWith(text: string) {
  return spyOn(globalThis, "fetch").mockResolvedValueOnce(
    Response.json({
      output: [
        { type: "reasoning" },
        { type: "message", content: [{ type: "output_text", text }] },
      ],
    }),
  );
}

test("returns the model's rows and rejects output that breaks the item contract", async () => {
  const fetchSpy = respondWith(
    JSON.stringify({
      items: [{ name: "Burger", quantity: 2, priceMinor: 25000 }],
      totalMinor: null,
    }),
  );

  expect(await caller.parse({ imageBase64: "abc" })).toEqual({
    items: [{ name: "Burger", quantity: 2, priceMinor: 25000 }],
    totalMinor: undefined,
  });
  const body = JSON.parse(fetchSpy.mock.calls[0]?.[1]?.body as string);
  expect(body.model).toBe("gpt-6-luna");
  expect(body.input[0].content[1].image_url).toBe("data:image/jpeg;base64,abc");

  respondWith(
    JSON.stringify({ items: [{ name: "Burger", quantity: 0, priceMinor: -1 }], totalMinor: null }),
  );
  await expect(caller.parse({ imageBase64: "abc" })).rejects.toThrow(/Unable to parse receipt/);
});
