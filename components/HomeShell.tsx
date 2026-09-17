"use client";

import { Suspense } from "react";
import { HomePageClient } from "@/components/HomePageClient";
import { TvHomePageClient } from "@/components/channels/TvHomePageClient";
import { ProjectToggle } from "@/components/ProjectToggle";
import { useProjectMode } from "@/lib/project-mode-context";

interface HomeShellProps {
  states: string[];
  genres: string[];
}

export function HomeShell({ states, genres }: HomeShellProps) {
  const { mode, setMode } = useProjectMode();
  const isTv = mode === "tv";

  return (
    <main className="mx-auto max-w-page px-4 py-8 pb-32 sm:px-6">
      <header className="mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[32px] font-medium leading-[1.13] tracking-[-0.022em] text-paper sm:text-heading-sm">
              {isTv ? "TV Project" : "Radio Project"}
            </h1>
            <p className="mt-2 max-w-xl text-[16px] font-normal leading-[1.5] text-fog">
              {isTv
                ? "Watch Australian free-to-air and community TV streams"
                : "Discover and listen to Australian commercial and community radio stations"}
            </p>
          </div>
          <ProjectToggle mode={mode} onModeChange={setMode} className="shrink-0" />
        </div>
      </header>
      {isTv ? (
        <TvHomePageClient />
      ) : (
        <Suspense
          fallback={
            <div className="mb-4 h-10 animate-pulse rounded-md bg-white/[0.02]" />
          }
        >
          <HomePageClient states={states} genres={genres} />
        </Suspense>
      )}
    </main>
  );
}
