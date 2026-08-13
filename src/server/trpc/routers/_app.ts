import { createTRPCRouter, publicProcedure } from "@/server/trpc/init";
import { analyticsRouter } from "@/server/trpc/routers/analytics";
import { billingRouter } from "@/server/trpc/routers/billing";
import { developerRouter } from "@/server/trpc/routers/developer";
import { feedbackRouter } from "@/server/trpc/routers/feedback";
import { adminRouter } from "@/server/trpc/routers/admin";
import { orgRouter } from "@/server/trpc/routers/org";
import { projectRouter } from "@/server/trpc/routers/project";
import { themeRouter } from "@/server/trpc/routers/theme";

export const appRouter = createTRPCRouter({
  /** Liveness probe reachable through the tRPC transport. */
  ping: publicProcedure.query(() => ({ ok: true as const })),

  admin: adminRouter,
  org: orgRouter,
  project: projectRouter,
  feedback: feedbackRouter,
  theme: themeRouter,
  analytics: analyticsRouter,
  developer: developerRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
