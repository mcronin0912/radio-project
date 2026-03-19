"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/components/HomePageClient";

interface StationFiltersProps {
  states: string[];
  genres: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export function StationFilters({
  states,
  genres,
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
    };
    setSearchInput("");
    onFiltersChange(cleared);
  }

  const hasFilters =
    filters.search || filters.state || filters.genre || filters.indigenous;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px] max-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search stations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <select
          value={filters.state}
          onChange={(e) => updateParams({ state: e.target.value })}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All regions</option>
          {states.slice(0, 30).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filters.genre}
          onChange={(e) => updateParams({ genre: e.target.value })}
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All genres</option>
          {genres.slice(0, 25).map((g) => (
            <option key={g} value={g}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-input cursor-pointer hover:bg-muted/50">
          <input
            type="checkbox"
            checked={filters.indigenous}
            onChange={(e) =>
              updateParams({ indigenous: e.target.checked })
            }
            className="rounded border-input"
          />
          <span className="text-sm whitespace-nowrap">First Nations</span>
        </label>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
