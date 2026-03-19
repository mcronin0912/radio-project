"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StationFiltersProps {
  states: string[];
  genres: string[];
  className?: string;
}

export function StationFilters({ states, genres, className }: StationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(q);
  const state = searchParams.get("state") ?? "";
  const genre = searchParams.get("genre") ?? "";
  const indigenous = searchParams.get("indigenous") === "1";

  useEffect(() => setSearchInput(q), [q]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== q) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) params.set("q", searchInput);
        else params.delete("q");
        router.push(`/?${params.toString()}`, { scroll: false });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, q, router, searchParams]);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    if ("q" in updates) setSearchInput(updates.q ?? "");
    router.push(`/?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    setSearchInput("");
    router.push("/", { scroll: false });
  }

  const hasFilters = q || state || genre || indigenous;

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
          value={state}
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
          value={genre}
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
            checked={indigenous}
            onChange={(e) =>
              updateParams({ indigenous: e.target.checked ? "1" : "" })
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
