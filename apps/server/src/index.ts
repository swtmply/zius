import { trpcServer } from "@hono/trpc-server";
import { Scalar } from "@scalar/hono-api-reference";
import { createContext } from "@zius/api/context";
import { createOpenApiDocument, handleOpenApiRequest, OPENAPI_ENDPOINT } from "@zius/api/openapi";
import { appRouter } from "@zius/api/routers/index";
import { auth } from "@zius/auth";
import { env } from "@zius/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

// The same procedures as `/trpc/*`, addressed as REST and described by `/openapi.json`.
app.all(`${OPENAPI_ENDPOINT}/*`, (c) => {
  return handleOpenApiRequest(c.req.raw, () => createContext({ context: c }));
});

const documentsByBaseUrl = new Map<string, ReturnType<typeof createOpenApiDocument>>();

/**
 * The document has to advertise the base the caller actually reached us through.
 * Running the server directly that is the request itself; behind the Vercel
 * rewrite the `/api` prefix is stripped before we see it, so SERVER_PUBLIC_URL
 * carries it instead.
 */
function openApiDocumentFor(requestUrl: string) {
  const url = new URL(requestUrl);
  const baseUrl =
    env.SERVER_PUBLIC_URL ?? `${url.origin}${url.pathname.replace(/\/openapi\.json$/, "")}`;
  const cached = documentsByBaseUrl.get(baseUrl);

  if (cached) {
    return cached;
  }

  const document = createOpenApiDocument(baseUrl);
  documentsByBaseUrl.set(baseUrl, document);
  return document;
}

app.get("/openapi.json", (c) => c.json(openApiDocumentFor(c.req.url)));

app.get(
  "/docs",
  Scalar({
    // Relative so the reference finds the document whether it was reached at
    // `/docs` or, behind the rewrite, at `/api/docs`.
    url: "./openapi.json",
    pageTitle: "Zius API reference",
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
