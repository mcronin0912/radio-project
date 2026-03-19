"use client";

import { StationCard } from "./StationCard";
import type { Station } from "@/lib/stations";

interface StationGridProps {
  stations: Station[];
}

export function StationGrid({ stations }: StationGridProps) {
  if (stations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No stations found. Try adjusting your search or filters.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => (
        <StationCard key={station.id} station={station} />
      ))}
    </div>
  );
}
