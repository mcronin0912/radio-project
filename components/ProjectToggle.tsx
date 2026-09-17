"use client";

import { cn } from "@/lib/utils";
import type { ProjectMode } from "@/lib/project-mode-context";

interface ProjectToggleProps {
  mode: ProjectMode;
  onModeChange: (mode: ProjectMode) => void;
  className?: string;
}

export function ProjectToggle({
  mode,
  onModeChange,
  className,
}: ProjectToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-inputs border border-white/[0.08] bg-white/[0.02] p-0.5",
        className
      )}
      role="group"
      aria-label="Project view"
    >
      {(
        [
          { id: "radio", label: "Radio" },
          { id: "tv", label: "TV" },
        ] as const
      ).map(({ id, label }) => {
        const active = mode === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange(id)}
            aria-pressed={active}
            className={cn(
              "rounded-[calc(var(--radius-inputs)-2px)] px-3.5 py-1.5 text-[13px] font-medium tracking-tight transition-colors",
              active
                ? "bg-paper text-void"
                : "text-fog hover:text-mist"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
