import { afterEach, describe, expect, test } from "bun:test";

import { createOpenApiDocument, OPENAPI_ENDPOINT } from "./openapi";
import {
  closeTestDatabases,
  createAnonymousRestClient,
  createRestClient,
  type RestClient,
} from "./testing";

afterEach(closeTestDatabases);

type Person = { id: string; displayName: string; email: string };
type Group = { id: string; name: string; defaultCurrency: string; createdAt: string };
type GroupDetail = Group & { members: { id: string; role: string }[] };
type Membership = { groupId: string; personId: string; role: string; removedAt: string | null };
type Expense = {
  id: string;
  groupId: string | null;
  title: string;
  status: string;
  totalMinor: number;
  occurredAt: string;
  participants: { personId: string; paidMinor: number; owedMinor: number }[];
};

async function ok<T>(response: Promise<{ status: number; body: unknown }>): Promise<T> {
  const { status, body } = await response;
  expect({ status, body }).toMatchObject({ status: 200 });
  return body as T;
}

async function groupFixture(rest: RestClient) {
  const owner = await ok<Person>(
    rest("POST", "/people/resolve", { displayName: "Owner", email: "owner@example.com" }),
  );
  const guest = await ok<Person>(
    rest("POST", "/people/resolve", { displayName: "Guest", email: "guest@example.com" }),
  );
  const group = await ok<Group>(rest("POST", "/groups", { name: "Trip", defaultCurrency: "PHP" }));
  await ok<Membership>(rest("POST", `/groups/${group.id}/members`, { personId: guest.id }));

  return { owner, guest, group };
}

describe("openapi document", () => {
  const document = createOpenApiDocument("https://zius.test/api");

  test("advertises the mount point the server serves the routes from", () => {
    expect(document.servers).toEqual([{ url: `https://zius.test/api${OPENAPI_ENDPOINT}` }]);
  });

  test("covers every expense, group and person procedure", () => {
    const operations = Object.entries(document.paths ?? {}).flatMap(([path, item]) =>
      Object.keys(item as Record<string, unknown>).map(
        (method) => `${method.toUpperCase()} ${path}`,
      ),
    );

    expect(operations.toSorted()).toEqual([
      "DELETE /groups/{groupId}/members/{personId}",
      "GET /expenses",
      "GET /expenses/{id}",
      "GET /groups",
      "GET /groups/{id}",
      "POST /expenses",
      "POST /expenses/{id}/cancel",
      "POST /groups",
      "POST /groups/{groupId}/members",
      "POST /people/resolve",
      "PUT /expenses/{id}",
    ]);
  });

  test("leaves the todo scaffold off the REST surface", () => {
    expect(JSON.stringify(document.paths)).not.toContain("todo");
  });

  test("marks the domain routes as requiring a session", () => {
    expect(document.paths?.["/groups"]?.get?.security).toEqual([
      { sessionCookie: [] },
      { bearerToken: [] },
    ]);
  });

  test("describes timestamps as date-time strings rather than a bare string", () => {
    expect(document.components?.schemas?.ExpenseGroup).toMatchObject({
      properties: { createdAt: { type: "string", format: "date-time" } },
    });
  });
});

describe("openapi routes", () => {
  test("creates and reads an expense group over REST", async () => {
    const { rest } = await createRestClient("owner", "Owner", "owner@example.com");
    const { guest, group } = await groupFixture(rest);

    expect(await ok<Group[]>(rest("GET", "/groups"))).toMatchObject([{ id: group.id }]);

    const detail = await ok<GroupDetail>(rest("GET", `/groups/${group.id}`));
    expect(detail.members.map(({ id, role }) => ({ id, role }))).toContainEqual({
      id: guest.id,
      role: "member",
    });
  });

  test("serializes timestamps as ISO-8601 strings", async () => {
    const { rest } = await createRestClient("owner", "Owner", "owner@example.com");
    const { group } = await groupFixture(rest);

    expect(group.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/);
  });

  test("takes path parameters without a request body", async () => {
    const { rest } = await createRestClient("owner", "Owner", "owner@example.com");
    const { guest, group } = await groupFixture(rest);

    const removal = await ok<Membership>(rest("DELETE", `/groups/${group.id}/members/${guest.id}`));

    expect(removal).toMatchObject({ groupId: group.id, personId: guest.id });
    expect(removal.removedAt).not.toBeNull();
  });

  test("runs an expense through its whole REST lifecycle", async () => {
    const { rest } = await createRestClient("owner", "Owner", "owner@example.com");
    const { owner, guest, group } = await groupFixture(rest);

    const created = await ok<Expense>(
      rest("POST", "/expenses", {
        groupId: group.id,
        title: "Dinner",
        totalMinor: 10_000,
        participants: [
          { personId: owner.id, paidMinor: 10_000, owedMinor: 5_000 },
          { personId: guest.id, paidMinor: 0, owedMinor: 5_000 },
        ],
      }),
    );

    expect(created).toMatchObject({ groupId: group.id, title: "Dinner", status: "active" });
    expect(created.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    expect(await ok<Expense>(rest("GET", `/expenses/${created.id}`))).toMatchObject({
      id: created.id,
    });

    const updated = await ok<Expense>(
      rest("PUT", `/expenses/${created.id}`, {
        groupId: group.id,
        title: "Late dinner",
        totalMinor: 12_000,
        participants: [
          { personId: owner.id, paidMinor: 12_000, owedMinor: 6_000 },
          { personId: guest.id, paidMinor: 0, owedMinor: 6_000 },
        ],
      }),
    );

    expect(updated).toMatchObject({ id: created.id, title: "Late dinner", totalMinor: 12_000 });

    const cancelled = await ok<Expense>(rest("POST", `/expenses/${created.id}/cancel`));
    expect(cancelled).toMatchObject({ id: created.id, status: "cancelled" });
  });

  test("reads the group filter from the query string", async () => {
    const { rest } = await createRestClient("owner", "Owner", "owner@example.com");
    const { owner, group } = await groupFixture(rest);

    await ok<Expense>(
      rest("POST", "/expenses", {
        groupId: null,
        title: "Solo coffee",
        totalMinor: 500,
        participants: [{ personId: owner.id, paidMinor: 500, owedMinor: 500 }],
      }),
    );
    await ok<Expense>(
      rest("POST", "/expenses", {
        groupId: group.id,
        title: "Dinner",
        totalMinor: 1_000,
        participants: [{ personId: owner.id, paidMinor: 1_000, owedMinor: 1_000 }],
      }),
    );

    expect(await ok<Expense[]>(rest("GET", "/expenses"))).toHaveLength(2);
    expect(await ok<Expense[]>(rest("GET", `/expenses?groupId=${group.id}`))).toMatchObject([
      { title: "Dinner" },
    ]);
  });

  test("maps tRPC error codes onto HTTP status codes", async () => {
    const { rest, db } = await createRestClient("owner", "Owner", "owner@example.com");
    const anonymous = createAnonymousRestClient(db);

    expect(await anonymous("GET", "/groups")).toMatchObject({
      status: 401,
      body: { code: "UNAUTHORIZED" },
    });
    expect(await rest("GET", "/groups/missing")).toMatchObject({
      status: 404,
      body: { code: "NOT_FOUND" },
    });
    expect(await rest("POST", "/groups", { name: "" })).toMatchObject({
      status: 400,
      body: { code: "BAD_REQUEST" },
    });
  });

  test("rejects a participant split that does not add up", async () => {
    const { rest } = await createRestClient("owner", "Owner", "owner@example.com");
    const { owner, group } = await groupFixture(rest);

    expect(
      await rest("POST", "/expenses", {
        groupId: group.id,
        title: "Dinner",
        totalMinor: 10_000,
        participants: [{ personId: owner.id, paidMinor: 9_000, owedMinor: 10_000 }],
      }),
    ).toMatchObject({ status: 400, body: { code: "BAD_REQUEST" } });
  });
});
