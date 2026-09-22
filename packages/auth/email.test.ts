import { afterEach, expect, mock, test } from "bun:test";

import { sendVerificationEmail } from "./src/email";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("sends the Better Auth verification URL through Resend", async () => {
  const fetchMock = mock(
    async (_input: Parameters<typeof fetch>[0], _init?: RequestInit) =>
      new Response(null, { status: 202 }),
  );
  globalThis.fetch = fetchMock as unknown as typeof fetch;

  await sendVerificationEmail({
    apiKey: "re_test",
    email: "person@example.com",
    url: "https://tryzius.com/api/auth/verify-email?token=test",
  });

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
    from: "Zius <noreply@tryzius.com>",
    to: "person@example.com",
    subject: "Verify your Zius email",
  });
});

test("fails when Resend rejects the verification email", async () => {
  globalThis.fetch = mock(
    async () => new Response(null, { status: 400 }),
  ) as unknown as typeof fetch;

  await expect(
    sendVerificationEmail({ apiKey: "re_test", email: "person@example.com", url: "zius://test" }),
  ).rejects.toThrow("Resend rejected the verification email (400)");
});
