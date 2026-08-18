"use client";

import { useEffect } from "react";

import { useProject } from "@/components/app/project-context";
import { api } from "@/trpc/client";

/**
 * Warms every main page's queries the moment the shell knows the active
 * project, using each page's own default parameters, so the first click on
 * a nav item paints from cache instead of a skeleton. Repeat visits were
 * already instant (staleTime); this fixes the first one.
 *
 * Fired from an idle callback: warming the cache must never compete with
 * whatever page the person actually landed on.
 */
export function PrefetchPages() {
  const { activeProject } = useProject();
  const utils = api.useUtils();
  const projectId = activeProject?.id;

  useEffect(() => {
    if (!projectId) return;

    const warm = () => {
      // Overview + Trends (they share overview/trend at 30 days)
      void utils.analytics.overview.prefetch({ projectId, days: 30 });
      void utils.analytics.trend.prefetch({ projectId, days: 30 });
      void utils.analytics.topThemes.prefetch({ projectId, limit: 5 });
      void utils.analytics.byType.prefetch({ projectId, days: 30 });
      void utils.theme.configured.prefetch();
      // Themes, at the page's default sort/status
      void utils.theme.list.prefetch({
        projectId,
        sort: "priority",
        status: "ACTIVE",
        limit: 100,
      });
      // Inbox, at the page's default filters
      void utils.feedback.list.prefetch({
        projectId,
        status: "ALL",
        sentiment: undefined,
        type: undefined,
        search: undefined,
        limit: 100,
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(warm, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(warm, 800);
    return () => window.clearTimeout(id);
  }, [projectId, utils]);

  return null;
}
