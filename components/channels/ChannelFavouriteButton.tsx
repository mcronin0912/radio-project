"use client";

import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTvFavourites } from "@/lib/tv-favourites-context";
import { cn } from "@/lib/utils";
import type { Channel } from "@/lib/channels";

interface ChannelFavouriteButtonProps {
  channel: Channel;
  className?: string;
  bordered?: boolean;
}

export function ChannelFavouriteButton({
  channel,
  className,
  bordered = false,
}: ChannelFavouriteButtonProps) {
  const { isFavourite, toggleFavourite } = useTvFavourites();
  const active = isFavourite(channel.slug);

  return (
    <Button
      type="button"
      variant={bordered ? "outline" : "ghost"}
      size="icon"
      className={cn(
        active && "text-coral-red hover:text-coral-red",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        toggleFavourite(channel.slug);
      }}
      aria-pressed={active}
      aria-label={
        active
          ? `Remove ${channel.name} from favourites`
          : `Favourite ${channel.name}`
      }
    >
      <Heart className={cn("h-4 w-4", active && "fill-current")} aria-hidden />
    </Button>
  );
}
