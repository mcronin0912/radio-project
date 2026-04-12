"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "community-radio-favourites";

type FavouritesContextValue = {
  favourites: ReadonlySet<string>;
  toggleFavourite: (slug: string) => void;
  isFavourite: (slug: string) => boolean;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      setFavourites(
        new Set(parsed.filter((x): x is string => typeof x === "string" && x.length > 0))
      );
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFavourite = useCallback((slug: string) => {
    if (!slug) return;
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isFavourite = useCallback(
    (slug: string) => favourites.has(slug),
    [favourites]
  );

  const value = useMemo<FavouritesContextValue>(
    () => ({
      favourites,
      toggleFavourite,
      isFavourite,
    }),
    [favourites, toggleFavourite, isFavourite]
  );

  return (
    <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) {
    throw new Error("useFavourites must be used within FavouritesProvider");
  }
  return ctx;
}
