import { trpcServer } from "@hono/trpc-server";
import { Scalar } from "@scalar/hono-api-reference";
import { createContext } from "@zius/api/context";
import { logProcedureError } from "@zius/api/log";
import { createOpenApiDocument, handleOpenApiRequest, OPENAPI_ENDPOINT } from "@zius/api/openapi";
import { v1Router } from "@zius/api/routers/index";
import { auth } from "@zius/auth";
import { env } from "@zius/env/server";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";

const app = new Hono().basePath("/api");

app.use(secureHeaders());
// Vercel already records method, path, status and duration per invocation, so
// in production this would only duplicate it at your own log volume.
if (env.NODE_ENV !== "production") app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  }),
);

// Caps the two things a request can spend without authenticating: bytes and
// function seconds. Both are per-request, so they hold on serverless where an
// in-process rate limiter would not.
app.use("/*", bodyLimit({ maxSize: 100 * 1024 }));
app.use("/*", timeout(15_000));

app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

const trpcMiddleware = trpcServer({
  router: v1Router,
  createContext: (_opts, context) => {
    return createContext({ context });
  },
  onError: logProcedureError,
});

app.use("/v1/trpc/*", trpcMiddleware);

// Legacy v1 route for app versions released before API paths were versioned.
app.use("/trpc/*", trpcMiddleware);

// Deliberately unversioned so every future app/API version can check compatibility first.
app.get("/mobile-compatibility", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json({
    ios: {
      minimumVersion: env.MOBILE_MINIMUM_IOS_VERSION,
      storeUrl: env.MOBILE_IOS_STORE_URL ?? null,
    },
    android: {
      minimumVersion: env.MOBILE_MINIMUM_ANDROID_VERSION,
      storeUrl: env.MOBILE_ANDROID_STORE_URL ?? null,
    },
  });
});

app.all(`${OPENAPI_ENDPOINT}/*`, (c) => {
  return handleOpenApiRequest(c.req.raw, () => createContext({ context: c }));
});

const documentsByBaseUrl = new Map<string, ReturnType<typeof createOpenApiDocument>>();

function getOpenApiDocument(requestUrl: string) {
  const url = new URL(requestUrl);
  const baseUrl = env.SERVER_PUBLIC_URL ?? url.origin;
  const cachedDocument = documentsByBaseUrl.get(baseUrl);

  if (cachedDocument) return cachedDocument;

  const document = createOpenApiDocument(baseUrl);
  documentsByBaseUrl.set(baseUrl, document);
  return document;
}

app.get("/openapi.json", (c) => c.json(getOpenApiDocument(c.req.url)));

app.get(
  "/docs",
  Scalar({
    url: "./openapi.json",
    pageTitle: "Zius API reference",
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
