import { afterEach, beforeEach, expect, test } from "bun:test";
import { sql } from "drizzle-orm";

import { getTestDatabase, resetTestDatabase } from "./support/database";
import { createExpense, createGroup, createPerson } from "./support/fixtures";

const db = await getTestDatabase();

/** The tables the fixtures below seed, spelled out so the reset is checked against something. */
const SEEDED_TABLES = [
  "user",
  "participant",
  "group",
  "group_member",
  "expense",
  "expense_participant",
];

beforeEach(async () => {
  await resetTestDatabase(db);
});

/** The reset restores whatever it found, so a test that leaves them off would leak that. */
afterEach(async () => {
  await db.run(sql`pragma foreign_keys = on`);
});

async function countRows(table: string) {
  const row = await db.get<{ count: number }>(
    sql.raw(`select count(*) as count from \`${table}\``),
  );

  return row?.count ?? 0;
}

async function foreignKeysEnforced() {
  const row = await db.get<{ foreign_keys: number }>(sql`pragma foreign_keys`);

  return row?.foreign_keys === 1;
}

/** A person, a group, and an expense between them: at least one row in every seeded table. */
async function seedEverything() {
  const payer = await createPerson(db);
  const other = await createPerson(db);
  const group = await createGroup(db, {
    owner: payer,
    members: [{ participantId: other.participantId }],
  });

  await createExpense(db, {
    payer,
    groupId: group.id,
    participants: [{ participantId: other.participantId, owedMinor: 500 }],
  });
}

test("empties every table the schema defines", async () => {
  await seedEverything();

  for (const table of SEEDED_TABLES) {
    expect(await countRows(table)).toBeGreaterThan(0);
  }

  await resetTestDatabase(db);

  for (const table of SEEDED_TABLES) {
    expect(await countRows(table)).toBe(0);
  }
});

test("empties a table added after this file was written", async () => {
  await db.run(sql`create table late_arrival (
    id text primary key,
    user_id text not null references user(id)
  )`);

  try {
    const person = await createPerson(db);
    await db.run(sql`insert into late_arrival (id, user_id) values ('a', ${person.userId})`);
    expect(await countRows("late_arrival")).toBe(1);

    await resetTestDatabase(db);

    expect(await countRows("late_arrival")).toBe(0);
    expect(await countRows("user")).toBe(0);
  } finally {
    await db.run(sql`drop table late_arrival`);
  }
});

test("keeps the migration ledger", async () => {
  const applied = await countRows("__drizzle_migrations");
  expect(applied).toBeGreaterThan(0);

  await resetTestDatabase(db);

  expect(await countRows("__drizzle_migrations")).toBe(applied);
});

test("resets with foreign keys enforced, and leaves them enforced", async () => {
  await db.run(sql`pragma foreign_keys = on`);
  await seedEverything();

  await resetTestDatabase(db);

  expect(await countRows("expense")).toBe(0);
  expect(await foreignKeysEnforced()).toBe(true);
});

test("resets with foreign keys off, and leaves them off", async () => {
  await seedEverything();
  await db.run(sql`pragma foreign_keys = off`);

  await resetTestDatabase(db);

  expect(await countRows("expense")).toBe(0);
  expect(await foreignKeysEnforced()).toBe(false);
});
