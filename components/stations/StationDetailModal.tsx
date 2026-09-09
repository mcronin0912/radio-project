"use client";

import Image from "next/image";
import { ExternalLink, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveIndicator } from "@/components/stations/LiveIndicator";
import { FavouriteButton } from "@/components/stations/FavouriteButton";
import { PlayButton } from "@/components/stations/PlayButton";
import { getStationContent, type Station } from "@/lib/stations";

interface StationDetailModalProps {
  station: Station;
  onClose: () => void;
}

export function StationDetailModal({ station, onClose }: StationDetailModalProps) {
  const content = getStationContent(station);

  return (
    <div
      className="fixed inset-0 z-40 bg-void"
      role="dialog"
      aria-modal="true"
      aria-labelledby="station-modal-title"
    >
      <div className="mx-auto max-h-[100dvh] max-w-page overflow-y-auto px-4 py-8 pb-32 sm:px-6">
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="mr-2 h-4 w-4" />
          Back to directory
        </Button>

        <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-cards bg-paper p-2 shadow-subtle">
            {station.logoUrl ? (
              <Image
                src={station.logoUrl}
                alt=""
                width={96}
                height={96}
                className="size-full object-contain"
                unoptimized
              />
            ) : (
              <Radio className="h-10 w-10 text-ash" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1
              id="station-modal-title"
              className="text-[32px] font-medium leading-[1.13] tracking-[-0.022em] text-paper"
            >
              {station.name}
            </h1>
            <p className="mt-2 text-[15px] font-normal text-fog">
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
              <p className="mt-4 text-[16px] font-normal leading-[1.5] text-mist">
                {station.description}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {station.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-badges bg-white/[0.05] px-1.5 py-0 text-[12px] font-normal text-fog"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <FavouriteButton station={station} bordered />
              <PlayButton station={station} />
              {station.website && (
                <a
                  href={station.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-buttons border border-graphite bg-transparent px-3 py-2 text-[13px] font-normal text-mist transition-colors hover:border-smoke hover:bg-white/[0.02]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              <LiveIndicator station={station} />
            </div>
          </div>
        </header>

        {content && (
          <section className="mt-12 rounded-cards border border-graphite bg-carbon/50 p-6 sm:p-8">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.04em] text-fog">
              About
            </h2>
            {content.attribution && (
              <p className="mt-1 text-[12px] font-normal text-ash">
                {station.name} is part of the {content.attribution}
              </p>
            )}
            {content.founded && (
              <p className="mt-3 text-[13px] font-normal text-fog">
                Est. {content.founded}
              </p>
            )}
            <p className="mt-2 text-[15px] font-normal leading-[1.6] text-mist">
              {content.about}
            </p>
            {content.sources.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-graphite pt-3 text-[12px] font-normal text-ash">
                <span>Sources:</span>
                {content.sources.map((src) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-graphite underline-offset-2 hover:text-fog"
                  >
                    {new URL(src).hostname.replace(/^www\./, "")}
                  </a>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
