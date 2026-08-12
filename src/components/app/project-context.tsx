"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/trpc/client";

type ProjectSummary = {
  id: string;
  name: string;
  key: string;
  url: string | null;
};

type ProjectContextValue = {
  projects: ProjectSummary[];
  activeProject: ProjectSummary | null;
  setActiveProjectId: (id: string) => void;
  isLoading: boolean;
};

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = "voicebox.activeProject";

/**
 * Which project the dashboard is looking at. Persisted to localStorage so
 * switching projects survives a reload, every page in the app reads from
 * here rather than threading a projectId through the router.
 */
export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = api.org.current.useQuery();

  // Lazy initializer rather than an effect: this reads once, during the first
  // render, instead of triggering a second render pass on mount.
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const projects = useMemo(() => data?.projects ?? [], [data]);

  // Fall back to the first project when nothing is stored, or when the stored
  // project has since been deleted.
  const activeProject = useMemo(() => {
    if (projects.length === 0) return null;
    return projects.find((p) => p.id === activeId) ?? projects[0]!;
  }, [projects, activeId]);

  function setActiveProjectId(id: string) {
    setActiveId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, id);
    }
  }

  return (
    <ProjectContext.Provider
      value={{ projects, activeProject, setActiveProjectId, isLoading }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used inside <ProjectProvider>");
  }
  return ctx;
}
