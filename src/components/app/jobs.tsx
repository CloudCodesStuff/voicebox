"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { toast } from "sonner";

import { api } from "@/trpc/client";

/* ---------------------------------------------------------------------------
   Long-running work, owned above the page.

   A mutation held in page state dies with the page: click Regroup, switch to
   Inbox, come back, and the button sits idle while the server is still
   working. The job map lives here, mounted once in the app layout, so the
   in-flight state and its start time survive navigation. The start time
   matters as much as the flag: the staged label ("Naming the themes…") is
   computed from when the job actually began, not from when the button most
   recently remounted.
--------------------------------------------------------------------------- */

type JobsContextValue = {
  /** ms epoch when the job started, or null when it isn't running. */
  runningSince: (key: string) => number | null;
  /** Cluster feedback into themes for a project. No-op if already running. */
  regroup: (projectId: string) => void;
};

const JobsContext = createContext<JobsContextValue | null>(null);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const utils = api.useUtils();
  const [jobs, setJobs] = useState<Record<string, number>>({});
  // Double-click guard lives in the updater, where the latest map is always
  // in hand, rather than in a ref synced during render.
  const startedRef = useRef<Set<string>>(new Set());

  const runningSince = useCallback(
    (key: string) => jobs[key] ?? null,
    [jobs],
  );

  const regroup = useCallback(
    (projectId: string) => {
      const key = `regroup:${projectId}`;
      if (startedRef.current.has(key)) return;
      startedRef.current.add(key);

      setJobs((j) => ({ ...j, [key]: Date.now() }));

      void utils.client.theme.recluster
        .mutate({ projectId })
        .then((result) => {
          toast.success(
            `Grouped ${result.items} items into ${result.themes} themes.`,
          );
          void utils.analytics.invalidate();
          void utils.theme.invalidate();
        })
        .catch((e: unknown) => {
          toast.error(e instanceof Error ? e.message : "Regrouping failed.");
        })
        .finally(() => {
          startedRef.current.delete(key);
          setJobs((j) => {
            const next = { ...j };
            delete next[key];
            return next;
          });
        });
    },
    [utils],
  );

  return (
    <JobsContext.Provider value={{ runningSince, regroup }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs(): JobsContextValue {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used inside JobsProvider");
  return ctx;
}
