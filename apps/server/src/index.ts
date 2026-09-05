import { trpcServer } from "@hono/trpc-server";
import { Scalar } from "@scalar/hono-api-reference";
import { createContext } from "@zius/api/context";
import {
  createOpenApiDocument,
  handleOpenApiRequest,
  OPENAPI_ENDPOINT,
} from "@zius/api/openapi";
import { appRouter } from "@zius/api/routers/index";
import { auth } from "@zius/auth";
import { env } from "@zius/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono().basePath("/api");

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.all(`${OPENAPI_ENDPOINT}/*`, (c) => {
  return handleOpenApiRequest(c.req.raw, () => createContext({ context: c }));
});

const documentsByBaseUrl = new Map<
  string,
  ReturnType<typeof createOpenApiDocument>
>();

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
