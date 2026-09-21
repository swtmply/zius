import { TRPCError } from "@trpc/server";
import { expect, test } from "bun:test";

import { logProcedureError } from "./log";

function capture(report: Parameters<typeof logProcedureError>[0]) {
  const lines: string[] = [];
  const original = console.error;
  console.error = (line: string) => lines.push(line);
  try {
    logProcedureError(report);
  } finally {
    console.error = original;
  }
  return lines;
}

test("reports an unexpected failure without leaking the input", () => {
  const [line] = capture({
    error: new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: new Error("db is down") }),
    type: "mutation",
    path: "expense.create",
  });

  expect(JSON.parse(line ?? "{}")).toMatchObject({ level: "error", path: "expense.create" });
});

test("stays quiet for the errors procedures raise on purpose", () => {
  expect(capture({ error: new TRPCError({ code: "NOT_FOUND" }), type: "query" })).toHaveLength(0);
});
