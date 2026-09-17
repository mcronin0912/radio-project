"use client";

import {
  ChannelGuideRow,
  GUIDE_LIST_GRID,
} from "@/components/channels/ChannelGuideRow";
import type { Channel } from "@/lib/channels";
import { cn } from "@/lib/utils";

interface ChannelGuideListProps {
  channels: Channel[];
  onChannelSelect?: (slug: string) => void;
  emptyMessage?: string;
}

export function ChannelGuideList({
  channels,
  onChannelSelect,
  emptyMessage,
}: ChannelGuideListProps) {
  if (channels.length === 0) {
    return (
      <div className="rounded-cards border border-dashed border-graphite bg-carbon/40 p-12 text-center text-[13px] font-normal text-fog">
        {emptyMessage ??
          "No channels found. Try adjusting your search or filters."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-cards border border-graphite bg-carbon/30">
      <div
        className={cn(
          "hidden border-b border-graphite px-4 py-2.5 sm:grid sm:gap-4",
          GUIDE_LIST_GRID
        )}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ash">
          Channel
        </p>
        {/* Match ProgrammeCell live-dot + gap so label lines up with titles */}
        <p className="pl-3.5 text-[11px] font-medium uppercase tracking-[0.04em] text-ash">
          Now playing
        </p>
        <p className="pl-3.5 text-[11px] font-medium uppercase tracking-[0.04em] text-ash">
          Next
        </p>
        <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ash">
          Details
        </p>
        <p className="text-right text-[11px] font-medium uppercase tracking-[0.04em] text-ash">
          Watch
        </p>
      </div>
      <div>
        {channels.map((channel) => (
          <ChannelGuideRow
            key={channel.slug}
            channel={channel}
            onChannelSelect={onChannelSelect}
          />
        ))}
      </div>
    </div>
  );
}
