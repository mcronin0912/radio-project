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

type DesktopFavouritesApi = {
  getFavourites: () => Promise<string[]>;
  setFavourites: (slugs: string[]) => Promise<string[]>;
};

declare global {
  interface Window {
    radioDesktop?: DesktopFavouritesApi;
  }
}

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

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

async function persist(slugs: string[]) {
  writeLocal(slugs);
  if (typeof window !== "undefined" && window.radioDesktop?.setFavourites) {
    try {
      await window.radioDesktop.setFavourites(slugs);
    } catch {
      /* ignore */
    }
  }
}

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let slugs = readLocal();

      if (window.radioDesktop?.getFavourites) {
        try {
          const desktopSlugs = await window.radioDesktop.getFavourites();
          if (Array.isArray(desktopSlugs) && desktopSlugs.length > 0) {
            slugs = desktopSlugs.filter(
              (x): x is string => typeof x === "string" && x.length > 0
            );
          } else if (slugs.length > 0) {
            // Migrate browser localStorage into the desktop file store
            await window.radioDesktop.setFavourites(slugs);
          }
        } catch {
          /* keep local */
        }
      }

      if (!cancelled) {
        setFavourites(new Set(slugs));
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavourite = useCallback((slug: string) => {
    if (!slug) return;
    setFavourites((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      const list = Array.from(next);
      void persist(list);
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
