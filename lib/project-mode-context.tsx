"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type ProjectMode = "radio" | "tv";

const STORAGE_KEY = "community-project-mode";

type ProjectModeContextValue = {
  mode: ProjectMode;
  setMode: (mode: ProjectMode) => void;
};

const ProjectModeContext = createContext<ProjectModeContextValue | null>(null);

export function ProjectModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ProjectMode>("radio");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "radio" || raw === "tv") setModeState(raw);
    } catch {
      /* ignore */
    }
  }, []);

  const setMode = useCallback((next: ProjectMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);

  return (
    <ProjectModeContext.Provider value={value}>
      {children}
    </ProjectModeContext.Provider>
  );
}

export function useProjectMode(): ProjectModeContextValue {
  const ctx = useContext(ProjectModeContext);
  if (!ctx) {
    throw new Error("useProjectMode must be used within ProjectModeProvider");
  }
  return ctx;
}
