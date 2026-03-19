"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StationFilters } from "@/components/stations/StationFilters";
import { StationGrid } from "@/components/stations/StationGrid";
import type { Station } from "@/lib/stations";

interface HomePageClientProps {
  states: string[];
  genres: string[];
}

export function HomePageClient({ states, genres }: HomePageClientProps) {
  const searchParams = useSearchParams();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get("q") ?? "";
  const state = searchParams.get("state") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const indigenous = searchParams.get("indigenous") ?? "";

  const fetchStations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (state) params.set("state", state);
    if (genre) params.set("genre", genre);
    if (indigenous) params.set("indigenous", indigenous);
    try {
      const res = await fetch(`/api/stations?${params.toString()}`);
      const data = await res.json();
      setStations(Array.isArray(data) ? data : []);
    } catch {
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, [q, state, genre, indigenous]);

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
