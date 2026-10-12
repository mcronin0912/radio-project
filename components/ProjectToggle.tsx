"use client";

import { cn } from "@/lib/utils";
import type { ProjectMode } from "@/lib/project-mode-context";

interface ProjectToggleProps {
  mode: ProjectMode;
  onModeChange: (mode: ProjectMode) => void;
  className?: string;
}

/**
 * Segmented control.
 * DESIGN.md: carbon surface, graphite hairline, pill radius (9999px).
 * Active segment is the neutral paper pill (bg #ffffff, text #08090a,
 * Inter 13px / weight 510). Acid lime stays reserved for play.
 * On phones both segments share the full width and are 44px tall.
 */
export function ProjectToggle({
  mode,
  onModeChange,
  className,
}: ProjectToggleProps) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-2 gap-0.5 rounded-full border border-graphite bg-carbon p-0.5 sm:w-auto",
        className
      )}
      role="tablist"
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
            role="tab"
            aria-selected={active}
            onClick={() => onModeChange(id)}
            className={cn(
              "min-h-11 rounded-full px-4 text-[13px] tracking-tight transition-colors [-webkit-tap-highlight-color:transparent] sm:min-h-9 sm:px-5",
              active
                ? "bg-paper font-medium text-void"
                : "font-normal text-fog"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
