# Community Radio Hub — Setup Guide

**MVP: No database required.** The station list is manually curated in `stations.json`.

## 1. Install and run

```bash
cd community-radio-hub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2. Curate your station list

Edit `stations.json` in the project root. Add, remove, or update stations. Each station needs:

| Field | Required | Description |
|-------|----------|-------------|
| `slug` | Yes | URL-friendly ID (e.g. `3rrr`) |
| `callsign` | Yes | Station callsign (e.g. `3RRR`) |
| `name` | Yes | Display name |
| `city` | Yes | City |
| `state` | Yes | State/territory (VIC, NSW, QLD, etc.) |
| `streamUrl` | Yes | Direct stream URL for playback |
| `frequency` | No | e.g. `102.7 FM` |
| `description` | No | Short description |
| `website` | No | Station website |
| `genres` | No | Array of genre tags |
| `logoUrl` | No | Logo image URL |

## 3. Verify stream URLs

Before going live, test each stream URL. Some in the default list may be placeholders:

```bash
# Quick test
curl -I --max-time 5 https://realtime.rrr.org.au/p1h

# Or open in VLC
vlc https://realtime.rrr.org.au/p1h
```

Update `stations.json` with working URLs. Known working streams (as of 2024):

- **3RRR** Melbourne: `https://realtime.rrr.org.au/p1h`
- **4ZZZ** Brisbane: `https://iheart.4zzz.org.au/4zzz`
- **RTRFM** Perth: `https://live.rtrfm.com.au/stream1`

## What's included (MVP)

- Station directory grid
- Station detail pages (`/station/[slug]`)
- API: `GET /api/stations`, `GET /api/stations/:id` (supports `?search=`, `?genre=`, `?state=`)
- Player bar UI (audio wiring in Sprint 2)

## Phase 2 (later)

When you're ready to add a database, Now Playing, and playlist history:

1. Set up Supabase and add `DATABASE_URL` to `.env.local`
2. Run `npm run db:migrate` and `npm run db:seed`
3. See `DEVELOPMENT_PLAN.md` for the full Phase 2 scope
