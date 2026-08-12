import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { NextRequest } from "next/server";

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
    },
  });

export { handler as GET, handler as POST };
