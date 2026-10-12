"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FilterPill,
  filterSelectClass,
  filterSelectStyle,
} from "@/components/ui/filter-controls";
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

const selectClass = filterSelectClass;

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
      favouritesOnly: true,
    };
    setSearchInput("");
    onFiltersChange(cleared);
  }

  const hasFilters =
    filters.search ||
    filters.state ||
    filters.genre ||
    filters.indigenous ||
    !filters.favouritesOnly;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-[240px] sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fog" />
          <Input
            placeholder="Search stations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-11 py-0 pl-9 text-base sm:h-auto sm:py-2.5 sm:text-[14px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <select
            value={filters.state}
            onChange={(e) => updateParams({ state: e.target.value })}
            className={selectClass}
            style={filterSelectStyle}
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
            style={filterSelectStyle}
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
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            pressed={filters.favouritesOnly}
            onPressedChange={(favouritesOnly) => updateParams({ favouritesOnly })}
          >
            Favourites
          </FilterPill>
          <FilterPill
            pressed={filters.indigenous}
            onPressedChange={(indigenous) => updateParams({ indigenous })}
          >
            First Nations
          </FilterPill>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-11 sm:h-9"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
