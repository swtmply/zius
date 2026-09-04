import { createOpenApiFetchHandler, generateOpenApiDocument } from "trpc-to-openapi";

import type { Context } from "./context";
import { appRouter } from "./routers/index";

export const OPENAPI_ENDPOINT = "/v1";

export function handleOpenApiRequest(
  request: Request,
  createContext: () => Context | Promise<Context>,
) {
  return createOpenApiFetchHandler({
    router: appRouter,
    createContext,
    endpoint: OPENAPI_ENDPOINT,
    req: request,
  });
}

export function createOpenApiDocument(baseUrl: string) {
  return generateOpenApiDocument(appRouter, {
    title: "Zius API",
    description: "REST endpoints backed by the same procedures as the Zius tRPC API.",
    version: "1.0.0",
    openApiVersion: "3.1.0",
    baseUrl: `${baseUrl}${OPENAPI_ENDPOINT}`,
    tags: ["Health", "Bills", "Groups", "Participants"],
  });
}
