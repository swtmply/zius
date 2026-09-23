import { createClient } from "@libsql/client";
import { expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/libsql";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as schema from "@zius/db/schema/index";
import type { Context } from "../src/context";

process.env.SKIP_ENV_VALIDATION = "1";
process.env.REVENUECAT_PROJECT_ID = "proj_test";
process.env.REVENUECAT_SECRET_KEY = "sk_test";
process.env.OPENAI_API_KEY = "test";

test("five successful AI scans are free; the sixth requires credits", async () => {
  const { receiptRouter } = await import("../src/routers/receipt");
  const { createCallerFactory } = await import("../src/index");
  const directory = mkdtempSync(join(tmpdir(), "zius-receipt-test-"));
  const client = createClient({ url: `file:${join(directory, "test.db")}` });
  const db = drizzle({ client, schema });
  await db.run(
    `CREATE TABLE user (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL, email_verified integer NOT NULL, free_ai_scans_used integer NOT NULL DEFAULT 0, created_at integer NOT NULL DEFAULT 0, updated_at integer NOT NULL DEFAULT 0, image text, deleted_at integer)`,
  );
  await db.run(
    `CREATE TABLE receipt_scan (id text PRIMARY KEY, user_id text NOT NULL, image_hash text NOT NULL, status text NOT NULL, source text, result text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
  );
  await db.run(
    `INSERT INTO user (id, name, email, email_verified) VALUES ('user_1', 'Test', 'test@example.com', 1)`,
  );
  const caller = createCallerFactory(receiptRouter)({
    db,
    session: { user: { id: "user_1", emailVerified: true } },
  } as unknown as Context);
  const originalFetch = globalThis.fetch;
  let creditCalls = 0;
  let balanceUnits = 0;
  let charges = 0;
  globalThis.fetch = (async (input, init) => {
    if (String(input).includes("revenuecat.com")) {
      creditCalls++;
      if (init?.method === "POST") {
        charges++;
        expect(JSON.parse(String(init.body)).adjustments.SCAN).toBe(-50);
        expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe(
          "scan-6-test:charge",
        );
        balanceUnits -= 50;
      }
      return Response.json({ items: [{ currency_code: "SCAN", balance: balanceUnits }] });
    }
    const items = String(init?.body).includes("base64,empty")
      ? []
      : [{ name: "Rice", quantity: 1, priceMinor: 10000 }];
    return Response.json({
      output: [
        {
          type: "message",
          content: [
            {
              type: "output_text",
              text: JSON.stringify({ items, totalMinor: items.length ? 10000 : null }),
            },
          ],
        },
      ],
    });
  }) as typeof fetch;
  try {
    for (let n = 0; n < 5; n++) {
      const result = await caller.parse({ requestId: `scan-${n}-test`, imageBase64: "abc" });
      expect(result.items[0]?.name).toBe("Rice");
    }
    expect(creditCalls).toBe(0);
    await expect(
      caller.parse({ requestId: "scan-5-test", imageBase64: "abc" }),
    ).rejects.toMatchObject({ code: "PAYMENT_REQUIRED" });
    expect(creditCalls).toBe(1);
    balanceUnits = 50;
    await expect(
      caller.parse({ requestId: "scan-empty", imageBase64: "empty" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(charges).toBe(0);
    const paid = await caller.parse({ requestId: "scan-6-test", imageBase64: "abc" });
    expect(paid.items[0]?.name).toBe("Rice");
    await caller.parse({ requestId: "scan-6-test", imageBase64: "abc" });
    expect(charges).toBe(1);
    await db.run(`UPDATE user SET free_ai_scans_used = 5 WHERE id = 'user_1'`);
    await db.run(
      `INSERT INTO receipt_scan (id, user_id, image_hash, status, source, created_at, updated_at) VALUES ('abandoned-free', 'user_1', 'hash', 'pending', 'free', 0, 0)`,
    );
    expect((await caller.allowance()).freeScansRemaining).toBe(1);
  } finally {
    globalThis.fetch = originalFetch;
    client.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
