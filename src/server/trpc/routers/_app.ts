import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";
import { analyticsRouter } from "@/server/trpc/routers/analytics";
import { developerRouter } from "@/server/trpc/routers/developer";
import { feedbackRouter } from "@/server/trpc/routers/feedback";
import { orgRouter } from "@/server/trpc/routers/org";
import { projectRouter } from "@/server/trpc/routers/project";
import { themeRouter } from "@/server/trpc/routers/theme";

export const appRouter = createTRPCRouter({
  /** Liveness probe reachable through the tRPC transport. */
  ping: publicProcedure.query(() => ({ ok: true as const })),

  org: orgRouter,
  project: projectRouter,
  feedback: feedbackRouter,
  theme: themeRouter,
  analytics: analyticsRouter,
  developer: developerRouter,
});

export type AppRouter = typeof appRouter;
