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
import { formatCategoryLabel } from "@/lib/filter-channels-client";

export interface ChannelFilterState {
  search: string;
  category: string;
  network: string;
  state: string;
  favouritesOnly: boolean;
}

interface ChannelFiltersProps {
  categories: string[];
  networks: string[];
  states: string[];
  filters: ChannelFilterState;
  onFiltersChange: (filters: ChannelFilterState) => void;
  className?: string;
}

const selectClass = filterSelectClass;

const STATE_LABEL: Record<string, string> = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  SA: "South Australia",
  WA: "Western Australia",
  NT: "Northern Territory",
  TAS: "Tasmania",
  ACT: "ACT",
};

export function ChannelFilters({
  categories,
  networks,
  states,
  filters,
  onFiltersChange,
  className,
}: ChannelFiltersProps) {
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

  function updateParams(updates: Partial<ChannelFilterState>) {
    const next = { ...filters, ...updates };
    onFiltersChange(next);
    if ("search" in updates) setSearchInput(updates.search ?? "");
  }

  function clearFilters() {
    const cleared: ChannelFilterState = {
      search: "",
      category: "",
      network: "",
      state: "NSW",
      favouritesOnly: true,
    };
    setSearchInput("");
    onFiltersChange(cleared);
  }

  const hasFilters =
    filters.search ||
    filters.category ||
    filters.network ||
    (filters.state && filters.state !== "NSW") ||
    !filters.favouritesOnly;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-[240px] sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fog" />
          <Input
            placeholder="Search channels..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-11 py-0 pl-9 text-base sm:h-auto sm:py-2.5 sm:text-[14px]"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <select
            value={filters.category}
            onChange={(e) => updateParams({ category: e.target.value })}
            className={selectClass}
            style={filterSelectStyle}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {formatCategoryLabel(c)}
              </option>
            ))}
          </select>
          <select
            value={filters.network}
            onChange={(e) => updateParams({ network: e.target.value })}
            className={selectClass}
            style={filterSelectStyle}
          >
            <option value="">All networks</option>
            {networks.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {states.length > 0 && (
            <select
              value={filters.state}
              onChange={(e) => updateParams({ state: e.target.value })}
              className={cn(selectClass, "col-span-2 sm:col-span-1")}
              style={filterSelectStyle}
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {STATE_LABEL[s] ?? s}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterPill
            pressed={filters.favouritesOnly}
            onPressedChange={(favouritesOnly) => updateParams({ favouritesOnly })}
          >
            Favourites
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
