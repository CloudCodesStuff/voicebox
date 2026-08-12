import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { createCallerFactory, createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/routers/_app";

/**
 * Direct server-side caller for React Server Components. Skips the HTTP hop
 * entirely, an RSC calling its own API over the network is a wasted round
 * trip. Cached per request so several components can call it without
 * re-resolving the session.
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers());
  heads.set("x-trpc-source", "rsc");
  return createTRPCContext({ headers: heads });
});

export const trpc = createCallerFactory(appRouter)(createContext);
