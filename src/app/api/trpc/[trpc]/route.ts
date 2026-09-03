import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { captureError } from "@/server/lib/errors";
import { createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/routers/_app";

/**
 * Most procedures here answer in milliseconds. One does not: `theme.regroup`
 * calls `runClustering`, which makes a model call over up to 120 items.
 *
 * Without this the route took the platform default, which is short enough that
 * a real clustering run was killed mid-flight — and a killed function never
 * reaches our catch, so the failure was recorded nowhere. Stated explicitly so
 * the relationship to `CLUSTER_TIMEOUT_MS` (45s, deliberately lower) is
 * visible from both ends.
 */
export const maxDuration = 60;

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError({ path, error }) {
      if (process.env.NODE_ENV === "development") {
        console.error(`tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
      }

      // Only genuine faults. A NOT_FOUND or a failed validation is the API
      // working correctly, and recording those would bury the real errors
      // under a pile of user typos.
      if (error.code === "INTERNAL_SERVER_ERROR") {
        void captureError({
          source: "trpc",
          error: error.cause ?? error,
          context: { path: path ?? "unknown" },
        });
      }
    },
  });

export { handler as GET, handler as POST };
