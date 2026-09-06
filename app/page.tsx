import { Suspense } from "react";
import { getFilterOptions } from "@/lib/stations";
import { HomePageClient } from "@/components/HomePageClient";

export const metadata = {
  title: "Radio Project",
  description:
    "Discover and listen to Australian commercial and community radio stations",
};

export default function HomePage() {
  const { states, genres } = getFilterOptions();

  return (
    <main className="mx-auto max-w-page px-4 py-8 pb-32 sm:px-6">
      <header className="mb-12">
        <h1 className="text-[32px] font-medium leading-[1.13] tracking-[-0.022em] text-paper sm:text-heading-sm">
          Radio Project
        </h1>
        <p className="mt-2 max-w-xl text-[16px] font-normal leading-[1.5] text-fog">
          Discover and listen to Australian commercial and community radio
          stations
        </p>
      </header>
      <Suspense
        fallback={
          <div className="mb-4 h-10 animate-pulse rounded-md bg-white/[0.02]" />
        }
      >
        <HomePageClient states={states} genres={genres} />
      </Suspense>
    </main>
  );
}
