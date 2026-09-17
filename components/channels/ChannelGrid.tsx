"use client";

import { ChannelCard } from "./ChannelCard";
import type { Channel } from "@/lib/channels";

interface ChannelGridProps {
  channels: Channel[];
  onChannelSelect?: (slug: string) => void;
  emptyMessage?: string;
}

export function ChannelGrid({
  channels,
  onChannelSelect,
  emptyMessage,
}: ChannelGridProps) {
  if (channels.length === 0) {
    return (
      <div className="rounded-cards border border-dashed border-graphite bg-carbon/40 p-12 text-center text-[13px] font-normal text-fog">
        {emptyMessage ??
          "No channels found. Try adjusting your search or filters."}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((channel) => (
        <ChannelCard
          key={channel.slug}
          channel={channel}
          onChannelSelect={onChannelSelect}
        />
      ))}
    </div>
  );
}
