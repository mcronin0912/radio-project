"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

const selectClass =
  "h-auto appearance-none rounded-inputs border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[13px] font-normal text-mist outline-none transition-colors focus:border-mist";

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
      favouritesOnly: false,
    };
    setSearchInput("");
    onFiltersChange(cleared);
  }

  const hasFilters =
    filters.search ||
    filters.category ||
    filters.network ||
    (filters.state && filters.state !== "NSW") ||
    filters.favouritesOnly;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[160px] max-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fog" />
          <Input
            placeholder="Search channels..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="py-2.5 pl-9"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) => updateParams({ category: e.target.value })}
          className={selectClass}
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
            className={selectClass}
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {STATE_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        )}
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
