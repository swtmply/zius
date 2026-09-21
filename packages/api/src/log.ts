import type { TRPCError } from "@trpc/server";

import type { Context } from "./context";

type ProcedureErrorReport = {
  error: TRPCError;
  type: "query" | "mutation" | "subscription" | "unknown";
  path?: string;
  ctx?: Context;
};

/**
 * Reports the errors a client cannot be blamed for.
 *
 * Both transports catch everything a procedure throws and turn it into a JSON
 * error response, so without this hook an unexpected failure reaches the client
 * as a 500 and leaves no trace on the server at all.
 *
 * Writes one JSON line to stderr, which Vercel captures and parses into
 * structured fields — no logging library involved. `input` is deliberately left
 * out: it carries emails, names and amounts.
 */
export function logProcedureError({ error, type, path, ctx }: ProcedureErrorReport) {
  // The other codes are outcomes the procedures raise on purpose — a 404 or a
  // 401 is the API working, and logging those buys noise.
  if (error.code !== "INTERNAL_SERVER_ERROR") return;

  console.error(
    JSON.stringify({
      level: "error",
      message: error.message,
      type,
      path: path ?? "unknown",
      userId: ctx?.session?.user.id,
      stack: error.cause instanceof Error ? error.cause.stack : error.stack,
    }),
  );
}
