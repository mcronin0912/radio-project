import { Suspense } from "react";
import Image from "next/image";
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
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="shrink-0 pt-0.5">
            <div className="rounded-xl border border-border/80 bg-background p-2">
              <Image
                src="/icon.svg"
                alt=""
                width={50}
                height={50}
                priority
                unoptimized
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Australian Radio Hub
            </h1>
            <p className="mt-0 text-muted-foreground">
              Discover and listen to Australian commercial and community radio
              stations
            </p>
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="h-12 mb-4 animate-pulse rounded bg-muted" />}>
        <HomePageClient states={states} genres={genres} />
      </Suspense>
    </main>
  );
}
