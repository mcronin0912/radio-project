"use client";

import { useCallback, useEffect, useState } from "react";
import { StationDetailModal } from "@/components/stations/StationDetailModal";
import { StationFilters } from "@/components/stations/StationFilters";
import { StationGrid } from "@/components/stations/StationGrid";
import {
  filterStationsClient,
  getFilterOptionsFromStations,
  type StationRow,
} from "@/lib/filter-stations-client";
import type { Station } from "@/lib/stations";
import { useFavourites } from "@/lib/favourites-context";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url || url === "null") return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");
}

function toStation(row: StationRow): Station {
  return {
    id: row.slug,
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

export interface FilterState {
  search: string;
  state: string;
  genre: string;
  indigenous: boolean;
  favouritesOnly: boolean;
}

interface HomePageClientProps {
  states: string[];
  genres: string[];
}

export function HomePageClient({ states, genres }: HomePageClientProps) {
  const { favourites } = useFavourites();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStations, setAllStations] = useState<StationRow[] | null>(null);
  const [selectedStationSlug, setSelectedStationSlug] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    state: "",
    genre: "",
    indigenous: false,
    favouritesOnly: false,
  });

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
    let filtered = filterStationsClient(allStations, {
      search: filters.search || undefined,
      state: filters.state || undefined,
      genre: filters.genre || undefined,
      indigenous: filters.indigenous,
    });
    if (filters.favouritesOnly) {
      filtered = filtered.filter((r) => favourites.has(r.slug));
    }
    setStations(filtered.map((r) => toStation(r)));
  }, [allStations, filters, favourites]);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const filterOptions = allStations
    ? getFilterOptionsFromStations(allStations)
    : {
        states,
        genres,
        locationGroups: [] as { group: string; options: { value: string; count: number }[] }[],
        genreGroups: [] as { group: string; options: { value: string; count: number }[] }[],
      };

  const modalStation =
    selectedStationSlug && allStations
      ? (() => {
          const row = allStations.find((r) => r.slug === selectedStationSlug);
          return row ? toStation(row) : null;
        })()
      : null;

  const openStation = useCallback((slug: string) => {
    setSelectedStationSlug(slug);
  }, []);

  const closeStation = useCallback(() => {
    setSelectedStationSlug(null);
  }, []);

  return (
    <>
      {modalStation && (
        <StationDetailModal station={modalStation} onClose={closeStation} />
      )}
      <StationFilters
        locationGroups={filterOptions.locationGroups}
        genreGroups={filterOptions.genreGroups}
        states={filterOptions.states}
        genres={filterOptions.genres}
        filters={filters}
        onFiltersChange={setFilters}
        className="mb-6"
      />
      {loading ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Loading stations...
        </div>
      ) : (
        <StationGrid
          stations={stations}
          onStationSelect={openStation}
          emptyMessage={
            filters.favouritesOnly
              ? "No favourite stations match these filters. Heart a station to save it, or turn off “Favourites only”."
              : undefined
          }
        />
      )}
    </>
  );
}
