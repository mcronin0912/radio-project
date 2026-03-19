"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Radio } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-context";
import type { Station } from "@/lib/stations";

interface StationCardProps {
  station: Station;
}

export function StationCard({ station }: StationCardProps) {
  const { station: currentStation, isPlaying, play } = usePlayer();
  const isCurrentStation = currentStation?.id === station.id;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow-md",
        isCurrentStation && "ring-2 ring-primary"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
              {station.logoUrl ? (
                <Image
                  src={station.logoUrl}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <Radio className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate">{station.name}</h3>
              <p className="text-sm text-muted-foreground">
                {Array.from(new Set([station.city, station.state].filter(Boolean))).join(", ") || "—"}
                {station.frequency && ` · ${station.frequency}`}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant={isCurrentStation && isPlaying ? "default" : "secondary"}
            className="shrink-0"
            onClick={() => play(station)}
            aria-label={`Play ${station.name}`}
          >
            <Play className="h-4 w-4 fill-current" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {station.genres.slice(0, 3).map((g) => (
            <span
              key={g}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {g}
            </span>
          ))}
        </div>
        {isCurrentStation && isPlaying && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span>Live</span>
          </div>
        )}
        <Link
          href={`/station/${station.slug}`}
          className="mt-2 block text-sm font-medium text-primary hover:underline"
        >
          View station →
        </Link>
      </CardContent>
    </Card>
  );
}
