import { beforeEach, describe, expect, test } from "bun:test";

import type { Database } from "@zius/db";
import { participant } from "@zius/db/schema/billing";
import { eq } from "drizzle-orm";

import { createCaller } from "./support/caller";
import { getTestDatabase, resetTestDatabase } from "./support/database";
import { createBill, createPerson } from "./support/fixtures";

let db: Database;

beforeEach(async () => {
  db = await getTestDatabase();
  await resetTestDatabase(db);
});

describe("dashboard.get", () => {
  test("nets what the caller is owed against what the caller owes", async () => {
    const ana = await createPerson(db, { email: "ana@example.com" });
    const ben = await createPerson(db, { email: "ben@example.com" });

    await createBill(db, {
      title: "Ana paid",
      totalMinor: 1000,
      payer: ana,
      participants: [{ participantId: ben.participantId, owedMinor: 700 }],
    });
    await createBill(db, {
      title: "Ben paid",
      totalMinor: 600,
      payer: ben,
      participants: [{ participantId: ana.participantId, owedMinor: 250 }],
    });

    const dashboard = await createCaller(db, ana).dashboard.get();

    expect(dashboard.balance).toEqual({
      owedToYouMinor: 700,
      youOweMinor: 250,
      netMinor: 450,
      currency: "PHP",
    });
  });

  test("ignores shares that have already been paid", async () => {
    const ana = await createPerson(db, { email: "ana@example.com" });
    const ben = await createPerson(db, { email: "ben@example.com" });

    await createBill(db, {
      totalMinor: 1000,
      payer: ana,
      participants: [{ participantId: ben.participantId, owedMinor: 700, status: "paid" }],
    });

    const dashboard = await createCaller(db, ana).dashboard.get();

    expect(dashboard.balance.owedToYouMinor).toBe(0);
  });

  test("lists active bills separately from recent ones", async () => {
    const ana = await createPerson(db, { email: "ana@example.com" });
    const ben = await createPerson(db, { email: "ben@example.com" });

    await createBill(db, {
      title: "Open",
      payer: ana,
      occurredAt: new Date(Date.UTC(2026, 0, 2)),
      participants: [{ participantId: ben.participantId, owedMinor: 500 }],
    });
    await createBill(db, {
      title: "Closed",
      payer: ana,
      occurredAt: new Date(Date.UTC(2026, 0, 1)),
      participants: [{ participantId: ben.participantId, owedMinor: 500, status: "paid" }],
    });

    const dashboard = await createCaller(db, ana).dashboard.get();

    expect(dashboard.activeTransactions.map((entry) => entry.title)).toEqual(["Open"]);
    expect(dashboard.recentTransactions.map((entry) => entry.title)).toEqual(["Open", "Closed"]);
    expect(dashboard.activeTransactions[0]?.participants).toHaveLength(2);
  });

  test("returns an empty dashboard for a caller with no participant record", async () => {
    const stranger = await createPerson(db, { email: "cara@example.com" });
    await db.delete(participant).where(eq(participant.id, stranger.participantId));

    const dashboard = await createCaller(db, stranger).dashboard.get();

    expect(dashboard).toEqual({
      balance: { owedToYouMinor: 0, youOweMinor: 0, netMinor: 0, currency: "PHP" },
      activeTransactions: [],
      recentTransactions: [],
    });
  });
});

describe("participant.current", () => {
  test("returns the participant claimed by the caller's account", async () => {
    const ana = await createPerson(db, { name: "Ana", email: "ana@example.com" });

    const current = await createCaller(db, ana).participant.current();

    expect(current).toEqual({
      id: ana.participantId,
      name: "Ana",
      email: "ana@example.com",
      userId: ana.userId,
    });
  });
});
