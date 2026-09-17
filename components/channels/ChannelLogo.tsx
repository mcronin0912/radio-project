"use client";

import { MediaLogo, type MediaLogoProps } from "@/components/MediaLogo";

/** TV channel logo — adaptive light/dark plate. */
export function ChannelLogo(props: Omit<MediaLogoProps, "kind">) {
  return <MediaLogo kind="tv" {...props} />;
}
