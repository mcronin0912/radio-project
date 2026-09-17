"use client";

import type { GuideProgramme } from "@/lib/channels";
import { cn } from "@/lib/utils";

interface ChannelGuideProps {
  loading: boolean;
  error: string | null;
  hasGuide?: boolean;
  programmes: GuideProgramme[];
  nowPlaying: GuideProgramme | null;
  className?: string;
}

function formatTime(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function formatRange(p: GuideProgramme) {
  return `${formatTime(p.start)} – ${formatTime(p.stop)}`;
}

export function ChannelGuidePanel({
  loading,
  error,
  hasGuide,
  programmes,
  nowPlaying,
  className,
}: ChannelGuideProps) {
  if (hasGuide === false) {
    return (
      <section className={cn("mt-12", className)}>
        <h2 className="text-[13px] font-medium uppercase tracking-[0.04em] text-fog">
          Guide
        </h2>
        <p className="mt-3 text-[13px] font-normal text-ash">
          No programme guide available for this channel.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("mt-12", className)}>
      <h2 className="text-[13px] font-medium uppercase tracking-[0.04em] text-fog">
        Guide
      </h2>

      {loading && (
        <p className="mt-3 text-[13px] font-normal text-ash">Loading guide…</p>
      )}

      {!loading && error && (
        <p className="mt-3 text-[13px] font-normal text-ash">{error}</p>
      )}

      {!loading && !error && programmes.length === 0 && (
        <p className="mt-3 text-[13px] font-normal text-ash">
          No upcoming programmes in the guide window.
        </p>
      )}

      {!loading && programmes.length > 0 && (
        <ul className="mt-4 divide-y divide-graphite border-t border-graphite">
          {programmes.map((p) => {
            const isNow = nowPlaying?.start === p.start && nowPlaying?.title === p.title;
            return (
              <li
                key={`${p.start}-${p.title}`}
                className={cn(
                  "flex gap-4 px-3 py-3 sm:px-4",
                  isNow && "bg-white/[0.02]"
                )}
              >
                <div className="w-[11.5rem] shrink-0 pt-0.5 font-mono text-[12px] font-normal tracking-tight text-fog sm:w-[13rem]">
                  {formatRange(p)}
                  {isNow && (
                    <span className="mt-1 flex items-center gap-1.5 text-[11px] text-pulse-green">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pulse-green" />
                      Now
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[14px] font-medium tracking-tight",
                      isNow ? "text-paper" : "text-mist"
                    )}
                  >
                    {p.title}
                  </p>
                  {p.subtitle && (
                    <p className="mt-0.5 text-[12px] font-normal text-fog">
                      {p.subtitle}
                    </p>
                  )}
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-[13px] font-normal leading-[1.45] text-ash">
                      {p.description}
                    </p>
                  )}
                  {p.category && (
                    <p className="mt-1.5 text-[11px] font-normal uppercase tracking-[0.04em] text-ash">
                      {p.category}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
