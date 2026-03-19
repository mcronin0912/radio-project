import { Suspense } from "react";
import { getFilterOptions } from "@/lib/stations";
import { HomePageClient } from "@/components/HomePageClient";

export const metadata = {
  title: "Australian Radio Hub",
  description: "Discover and listen to Australian commercial and community radio stations",
};

export default function HomePage() {
  const { states, genres } = getFilterOptions();

  return (
    <main className="container mx-auto px-4 py-8 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Australian Radio Hub
        </h1>
        <p className="mt-2 text-muted-foreground">
          Discover and listen to Australian commercial and community radio stations
        </p>
      </header>
      <Suspense fallback={<div className="h-12 mb-4 animate-pulse rounded bg-muted" />}>
        <HomePageClient states={states} genres={genres} />
      </Suspense>
    </main>
  );
}
