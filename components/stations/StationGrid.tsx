"use client";

import { StationCard } from "./StationCard";
import type { Station } from "@/lib/stations";

interface StationGridProps {
  stations: Station[];
  onStationSelect?: (slug: string) => void;
  emptyMessage?: string;
}

export function StationGrid({
  stations,
  onStationSelect,
  emptyMessage,
}: StationGridProps) {
  if (stations.length === 0) {
    return (
      <div className="rounded-cards border border-dashed border-graphite bg-carbon/40 p-12 text-center text-[13px] font-normal text-fog">
        {emptyMessage ??
          "No stations found. Try adjusting your search or filters."}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          onStationSelect={onStationSelect}
        />
      ))}
    </div>
  );
}
