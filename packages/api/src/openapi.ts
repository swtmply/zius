import { createOpenApiFetchHandler, generateOpenApiDocument } from "trpc-to-openapi";

import type { Context } from "./context";
import { appRouter } from "./routers/index";

/**
 * The REST surface is mounted under this prefix on the Hono app. Behind the
 * Vercel rewrite the same routes are reachable at `/api/v1/*`, because the
 * rewrite strips the `/api` segment before the request reaches the server.
 */
export const OPENAPI_ENDPOINT = "/v1";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

/**
 * The adapter rejects any body-accepting method that arrives without a JSON
 * content-type, and then fails to parse an empty body. Routes whose inputs all
 * come from the path — `POST /expenses/{id}/cancel` — declare no request body
 * at all, so a caller following the generated document sends neither. Treat
 * that as the empty JSON object it stands for.
 */
async function asJsonRequest(request: Request) {
  if (!METHODS_WITH_BODY.has(request.method) || request.headers.has("content-type")) {
    return request;
  }

  const body = await request.text();
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");

  return new Request(request.url, {
    method: request.method,
    headers,
    body: body === "" ? "{}" : body,
  });
}

export async function handleOpenApiRequest(
  request: Request,
  createContext: () => Context | Promise<Context>,
) {
  return createOpenApiFetchHandler({
    router: appRouter,
    createContext,
    endpoint: OPENAPI_ENDPOINT,
    req: await asJsonRequest(request),
  });
}

export function createOpenApiDocument(baseUrl: string) {
  return generateOpenApiDocument(appRouter, {
    title: "Zius API",
    description:
      "REST access to the shared-expense API. Every route is generated from the tRPC procedure of the same name, so both transports share one implementation.",
    version: "1.0.0",
    openApiVersion: "3.1.0",
    baseUrl: `${baseUrl}${OPENAPI_ENDPOINT}`,
    tags: ["Expenses", "Expense groups", "People"],
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "better-auth.session_token",
        description:
          "Better-Auth session cookie, set by the sign-in routes under `/api/auth`. Send it with `credentials: 'include'`.",
      },
      bearerToken: {
        type: "http",
        scheme: "bearer",
        description:
          "Better-Auth bearer token, for clients that cannot hold cookies (the Expo app).",
      },
    },
  });
}
