"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "community-tv-favourites";

type TvFavouritesContextValue = {
  favourites: ReadonlySet<string>;
  toggleFavourite: (slug: string) => void;
  isFavourite: (slug: string) => boolean;
};

const TvFavouritesContext = createContext<TvFavouritesContextValue | null>(null);

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

function writeLocal(slugs: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    /* ignore */
  }
}

export function TvFavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setFavourites(new Set(readLocal()));
  }, []);

  const toggleFavourite = useCallback((slug: string) => {
    if (!slug) return;
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      writeLocal(Array.from(next));
      return next;
    });
  }, []);

  const isFavourite = useCallback(
    (slug: string) => favourites.has(slug),
    [favourites]
  );

  const value = useMemo<TvFavouritesContextValue>(
    () => ({ favourites, toggleFavourite, isFavourite }),
    [favourites, toggleFavourite, isFavourite]
  );

  return (
    <TvFavouritesContext.Provider value={value}>
      {children}
    </TvFavouritesContext.Provider>
  );
}

export function useTvFavourites(): TvFavouritesContextValue {
  const ctx = useContext(TvFavouritesContext);
  if (!ctx) {
    throw new Error("useTvFavourites must be used within TvFavouritesProvider");
  }
  return ctx;
}
