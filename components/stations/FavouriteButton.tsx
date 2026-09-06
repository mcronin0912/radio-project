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
      variant={bordered ? "outline" : "ghost"}
      size={size}
      className={cn(
        active && "text-coral-red hover:text-coral-red",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavourite(slug);
      }}
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${station.name} from favourites`
          : `Favourite ${station.name}`
      }
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} aria-hidden />
    </Button>
  );
}
