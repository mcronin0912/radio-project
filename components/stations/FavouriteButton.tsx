"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavourites } from "@/lib/favourites-context";
import { cn } from "@/lib/utils";
import type { Station } from "@/lib/stations";

interface FavouriteButtonProps {
  station: Station;
  className?: string;
  size?: "default" | "icon";
  /** Bordered `bg-background` style (matches the station modal Website link). */
  bordered?: boolean;
}

export function FavouriteButton({
  station,
  className,
  size = "icon",
  bordered = false,
}: FavouriteButtonProps) {
  const { isFavourite, toggleFavourite } = useFavourites();
  const slug = station.slug || station.id;
  const active = isFavourite(slug);

  return (
    <Button
      type="button"
      variant={bordered ? "outline" : "secondary"}
      size={size}
      className={cn(
        bordered &&
          "border-input bg-background hover:bg-muted dark:bg-background dark:hover:bg-muted",
        active && "text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavourite(slug);
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${station.name} from favourites` : `Favourite ${station.name}`}
    >
      <Heart
        className={cn("h-4 w-4", active && "fill-current")}
        aria-hidden
      />
    </Button>
  );
}
