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
    <main className="mx-auto max-w-page px-4 pb-32 pt-6 sm:px-6 sm:py-8">
      <header className="mb-6 sm:mb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-subheading tracking-[-0.012em] text-paper sm:text-heading-sm sm:tracking-[-0.022em]">
              {isTv ? "TV Project" : "Radio Project"}
            </h1>
            <p className="mt-2 max-w-xl text-[15px] font-normal leading-[1.6] tracking-[-0.011em] text-fog sm:text-[16px] sm:leading-[1.5]">
              {isTv
                ? "Watch Australian free-to-air and community TV streams"
                : "Discover and listen to Australian commercial and community radio stations"}
            </p>
          </div>
          <ProjectToggle mode={mode} onModeChange={setMode} className="sm:shrink-0" />
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
