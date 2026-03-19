"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StationFilters } from "@/components/stations/StationFilters";
import { StationGrid } from "@/components/stations/StationGrid";
import {
  filterStationsClient,
  type StationRow,
} from "@/lib/filter-stations-client";
import type { Station } from "@/lib/stations";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url || url === "null") return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

function toStation(row: StationRow, index: number): Station {
  return {
    id: `station-${index}`,
    slug: row.slug,
    callsign: row.callsign,
    name: row.name,
    frequency: row.frequency ?? null,
    city: row.city ?? "",
    state: row.state ?? "",
    description: null,
    website: row.website ?? null,
    streamUrl: row.streamUrl ?? null,
    streamFormat: row.streamFormat ?? null,
    streamBitrate: row.streamBitrate ?? null,
    metadataTier: 0,
    metadataUrl: null,
    logoUrl: isValidImageUrl(row.logoUrl) ? row.logoUrl : null,
    genres: row.genres ?? [],
    indigenous: row.indigenous ?? false,
  };
}

interface HomePageClientProps {
  states: string[];
  genres: string[];
}

export function HomePageClient({ states, genres }: HomePageClientProps) {
  const searchParams = useSearchParams();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStations, setAllStations] = useState<StationRow[] | null>(null);

  const q = searchParams.get("q") ?? "";
  const state = searchParams.get("state") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const indigenous = searchParams.get("indigenous") === "1";

  useEffect(() => {
    fetch(`${BASE}/stations-from-api.json`)
      .then((r) => r.json())
      .then((data) => setAllStations(Array.isArray(data) ? data : []))
      .catch(() => setAllStations([]));
  }, []);

  const fetchStations = useCallback(() => {
    if (!allStations) {
      setLoading(true);
      return;
    }
    setLoading(false);
    const filtered = filterStationsClient(allStations, {
      search: q || undefined,
      state: state || undefined,
      genre: genre || undefined,
      indigenous,
    });
    setStations(filtered.map((r, i) => toStation(r, i)));
  }, [allStations, q, state, genre, indigenous]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return (
    <>
      <StationFilters states={states} genres={genres} className="mb-6" />
      {loading ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Loading stations...
        </div>
      ) : (
        <StationGrid stations={stations} />
      )}
    </>
  );
}
