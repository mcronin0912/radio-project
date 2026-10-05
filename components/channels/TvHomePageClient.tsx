"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChannelFilters,
  type ChannelFilterState,
} from "@/components/channels/ChannelFilters";
import { ChannelGuideList } from "@/components/channels/ChannelGuideList";
import {
  filterChannelsClient,
  getFilterOptionsFromChannels,
  type ChannelRow,
} from "@/lib/filter-channels-client";
import type { Channel } from "@/lib/channels";
import { useTvFavourites } from "@/lib/tv-favourites-context";
import { usePlayer } from "@/lib/player-context";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function isValidImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || !url || url === "null") return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("/")
  );
}

function toChannel(row: ChannelRow): Channel {
  return {
    ...row,
    logoUrl: isValidImageUrl(row.logoUrl) ? row.logoUrl : null,
  };
}

export function TvHomePageClient() {
  const { favourites } = useTvFavourites();
  const { openTvModal } = usePlayer();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [allChannels, setAllChannels] = useState<ChannelRow[] | null>(null);
  const [filters, setFilters] = useState<ChannelFilterState>({
    search: "",
    category: "",
    network: "",
    state: "NSW",
    favouritesOnly: false,
  });

  useEffect(() => {
    fetch(`${BASE}/channels-from-api.json`)
      .then((r) => r.json())
      .then((data) => setAllChannels(Array.isArray(data) ? data : []))
      .catch(() => setAllChannels([]));
  }, []);

  const applyFilters = useCallback(() => {
    if (!allChannels) {
      setLoading(true);
      return;
    }
    setLoading(false);
    let filtered = filterChannelsClient(allChannels, {
      search: filters.search || undefined,
      category: filters.category || undefined,
      network: filters.network || undefined,
      state: filters.state || undefined,
    });
    if (filters.favouritesOnly) {
      filtered = filtered.filter((r) => favourites.has(r.slug));
    }
    setChannels(filtered.map((r) => toChannel(r)));
  }, [allChannels, filters, favourites]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const filterOptions = allChannels
    ? getFilterOptionsFromChannels(allChannels)
    : { categories: [], networks: [], states: [] };

  const openChannel = useCallback(
    (slug: string) => {
      const row = allChannels?.find((r) => r.slug === slug);
      if (row) openTvModal(toChannel(row));
    },
    [allChannels, openTvModal]
  );

  return (
    <>
      <ChannelFilters
        categories={filterOptions.categories}
        networks={filterOptions.networks}
        states={filterOptions.states}
        filters={filters}
        onFiltersChange={setFilters}
        className="mb-6"
      />
      {loading ? (
        <div className="rounded-cards border border-dashed border-graphite bg-carbon/40 p-12 text-center text-[13px] font-normal text-fog">
          Loading channels...
        </div>
      ) : (
        <ChannelGuideList
          channels={channels}
          onChannelSelect={openChannel}
          emptyMessage={
            filters.favouritesOnly
              ? "No favourite channels match these filters. Heart a channel to save it, or turn off “Favourites only”."
              : undefined
          }
        />
      )}
    </>
  );
}
