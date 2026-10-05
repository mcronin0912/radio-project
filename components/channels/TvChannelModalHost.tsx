"use client";

import { ChannelDetailModal } from "@/components/channels/ChannelDetailModal";
import { usePlayer } from "@/lib/player-context";

/** Always-mounted host so the TV detail modal can reopen from the player bar. */
export function TvChannelModalHost() {
  const { tvModalChannel, closeTvModal } = usePlayer();

  if (!tvModalChannel) return null;

  return (
    <ChannelDetailModal
      channel={tvModalChannel}
      onClose={closeTvModal}
    />
  );
}
