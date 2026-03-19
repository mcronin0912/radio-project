"use client";

import Image from "next/image";
import { ExternalLink, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/stations/LiveIndicator";
import { PlayButton } from "@/components/stations/PlayButton";
import type { Station } from "@/lib/stations";

interface StationDetailModalProps {
  station: Station;
  onClose: () => void;
}

export function StationDetailModal({ station, onClose }: StationDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-modal-title"
    >
      <div className="container mx-auto max-h-[100dvh] overflow-y-auto px-4 py-8 pb-24">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="mr-2 h-4 w-4" />
          Back to directory
        </Button>

        <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted">
            {station.logoUrl ? (
              <Image
                src={station.logoUrl}
                alt=""
                width={96}
                height={96}
                className="rounded-xl object-cover"
                unoptimized
              />
            ) : (
              <Radio className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1
              id="station-modal-title"
              className="text-3xl font-bold tracking-tight"
            >
              {station.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {[
                Array.from(
                  new Set([station.city, station.state].filter(Boolean))
                ).join(", ") || null,
                station.frequency,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {station.description && (
              <p className="mt-4 text-muted-foreground">
                {station.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {station.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PlayButton station={station} />
              {station.website && (
                <a
                  href={station.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-2.5 text-sm font-medium hover:bg-muted"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Website
                </a>
              )}
              <LiveIndicator station={station} />
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Now Playing and playlist history will appear here when we add the
          database and metadata polling (Phase 2).
        </section>
      </div>
    </div>
  );
}
