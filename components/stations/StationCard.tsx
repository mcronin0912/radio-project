"use client";

import Image from "next/image";
import { Pause, Play, Radio } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FavouriteButton } from "@/components/stations/FavouriteButton";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-context";
import type { Station } from "@/lib/stations";

interface StationCardProps {
  station: Station;
  onStationSelect?: (slug: string) => void;
}

export function StationCard({ station, onStationSelect }: StationCardProps) {
  const { station: currentStation, isPlaying, play, pause } = usePlayer();
  const isCurrentStation = currentStation?.id === station.id;
  const isLive = isCurrentStation && isPlaying;

  return (
    <Card
      className={cn(
        "transition-colors",
        isLive && "shadow-[inset_0_0_0_1px_var(--color-acid-lime)]"
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-paper p-1">
              {station.logoUrl ? (
                <Image
                  src={station.logoUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="size-full rounded-sm object-contain"
                  unoptimized
                />
              ) : (
                <Radio className="h-5 w-5 text-ash" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="break-words text-[15px] font-medium tracking-tight text-paper">
                {station.name}
              </h3>
              <p className="mt-0.5 text-[13px] font-normal text-fog">
                {Array.from(
                  new Set([station.city, station.state].filter(Boolean))
                ).join(", ") || "—"}
                {station.frequency && ` · ${station.frequency}`}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <FavouriteButton station={station} />
            <Button
              size="icon"
              variant={isLive ? "default" : "outline"}
              onClick={() =>
                isCurrentStation && isPlaying ? pause() : play(station)
              }
              aria-label={
                isCurrentStation && isPlaying ? "Pause" : `Play ${station.name}`
              }
            >
              {isCurrentStation && isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {station.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="rounded-badges bg-white/[0.05] px-1.5 py-0 text-[12px] font-normal leading-[1.4] text-fog"
            >
              {g}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-end justify-between gap-2">
          <button
            type="button"
            onClick={() => onStationSelect?.(station.slug)}
            className="text-left text-[13px] font-normal text-mist transition-colors hover:text-paper"
          >
            View station →
          </button>
          {isLive && (
            <div className="flex shrink-0 items-center gap-1.5 text-[12px] font-normal text-fog">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pulse-green" />
              <span>Live</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
