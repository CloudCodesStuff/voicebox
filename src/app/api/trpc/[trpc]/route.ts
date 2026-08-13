import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

import { captureError } from "@/server/lib/errors";
import { createTRPCContext } from "@/server/trpc/init";
import { appRouter } from "@/server/trpc/routers/_app";

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
