// Shared TypeScript types for Community Radio Hub

export interface Station {
  id: string;
  slug: string;
  callsign: string;
  name: string;
  frequency: string | null;
  city: string;
  state: string;
  description: string | null;
  website: string | null;
  streamUrl: string | null;
  streamFormat: string | null;
  streamBitrate: number | null;
  metadataTier: number;
  metadataUrl: string | null;
  logoUrl: string | null;
  lat: number | null;
  lng: number | null;
  genres: string[];
  indigenous: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NowPlaying {
  id: string;
  stationId: string;
  artist: string | null;
  title: string | null;
  album: string | null;
  artUrl: string | null;
  startedAt: Date | null;
  fetchedAt: Date;
}

export interface PlaylistItem {
  id: string;
  stationId: string;
  artist: string | null;
  title: string | null;
  album: string | null;
  playedAt: Date;
  createdAt: Date;
}
