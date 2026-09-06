"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/components/HomePageClient";
import type { FilterOptionGroup } from "@/lib/filter-stations-client";
import {
  formatGenreOptionLabel,
  formatLocationOptionLabel,
} from "@/lib/filter-stations-client";

interface StationFiltersProps {
  states: string[];
  genres: string[];
  locationGroups: FilterOptionGroup[];
  genreGroups: FilterOptionGroup[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

const selectClass =
  "h-auto appearance-none rounded-inputs border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[13px] font-normal text-mist outline-none transition-colors focus:border-mist";

export function StationFilters({
  states,
  genres,
  locationGroups,
  genreGroups,
  filters,
  onFiltersChange,
  className,
}: StationFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => setSearchInput(filters.search), [filters.search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const current = filtersRef.current;
      if (searchInput !== current.search) {
        onFiltersChange({ ...current, search: searchInput });
      }
      debounceRef.current = null;
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, onFiltersChange]);

  function updateParams(updates: Partial<FilterState>) {
    const next = { ...filters, ...updates };
    onFiltersChange(next);
    if ("search" in updates) setSearchInput(updates.search ?? "");
  }

  function clearFilters() {
    const cleared: FilterState = {
      search: "",
      state: "",
      genre: "",
      indigenous: false,
      favouritesOnly: false,
    };
    setSearchInput("");
    onFiltersChange(cleared);
  }

  const hasFilters =
    filters.search ||
    filters.state ||
    filters.genre ||
    filters.indigenous ||
    filters.favouritesOnly;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] max-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fog" />
          <Input
            placeholder="Search stations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="py-2.5 pl-9"
          />
        </div>
        <select
          value={filters.state}
          onChange={(e) => updateParams({ state: e.target.value })}
          className={selectClass}
        >
          <option value="">All locations</option>
          {locationGroups.length > 0
            ? locationGroups.map(({ group, options }) => (
                <optgroup key={group} label={group}>
                  {options.map(({ value, count }) => (
                    <option key={value} value={value}>
                      {formatLocationOptionLabel(value)} ({count})
                    </option>
                  ))}
                </optgroup>
              ))
            : states.map((s) => (
                <option key={s} value={s}>
                  {formatLocationOptionLabel(s)}
                </option>
              ))}
        </select>
        <select
          value={filters.genre}
          onChange={(e) => updateParams({ genre: e.target.value })}
          className={selectClass}
        >
          <option value="">All genres</option>
          {genreGroups.length > 0
            ? genreGroups.map(({ group, options }) => (
                <optgroup key={group} label={group}>
                  {options.map(({ value, count }) => (
                    <option key={value} value={value}>
                      {formatGenreOptionLabel(value)} ({count})
                    </option>
                  ))}
                </optgroup>
              ))
            : genres.map((g) => (
                <option key={g} value={g}>
                  {formatGenreOptionLabel(g)}
                </option>
              ))}
        </select>
        <label className="flex h-auto cursor-pointer items-center gap-2 rounded-inputs border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 hover:bg-white/[0.04]">
          <input
            type="checkbox"
            checked={filters.favouritesOnly}
            onChange={(e) =>
              updateParams({ favouritesOnly: e.target.checked })
            }
            className="size-3.5 rounded-sm border-graphite accent-acid-lime"
          />
          <span className="whitespace-nowrap text-[13px] font-normal text-mist">
            Favourites only
          </span>
        </label>
        <label className="flex h-auto cursor-pointer items-center gap-2 rounded-inputs border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 hover:bg-white/[0.04]">
          <input
            type="checkbox"
            checked={filters.indigenous}
            onChange={(e) => updateParams({ indigenous: e.target.checked })}
            className="size-3.5 rounded-sm border-graphite accent-acid-lime"
          />
          <span className="whitespace-nowrap text-[13px] font-normal text-mist">
            First Nations
          </span>
        </label>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
