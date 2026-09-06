# Radio Project — Mac desktop app (Electron)

Self-contained Mac app: bundled station UI + local stream proxy. Live audio still needs the network.

## Prerequisites

- Node 20+
- macOS

## Develop (Electron + Next)

```bash
cd community-radio-hub
npm install
npm run electron:dev
```

This starts Next on `http://127.0.0.1:4173` and opens an Electron window against it (uses the real `/api/stream` route).

## Build a `.app` / DMG

```bash
npm run electron:pack
```

Produces:

- `dist-desktop/mac-arm64/Radio Project.app` (or `mac/` on Intel)
- `dist-desktop/Radio Project-*.dmg`

## Run the packaged app

Double-click **Radio Project.app**, or:

```bash
open "dist-desktop/mac-arm64/Radio Project.app"
```

## Share via private GitHub

1. Push the repo (private).
2. Attach the DMG (or zip the `.app`) to a private Release, or share the file directly.
3. **Gatekeeper (unsigned):** friends may need to right-click the app → **Open** → confirm the first time. Or: System Settings → Privacy & Security → allow the blocked app.

No Apple Developer account or notarization is required for personal / private sharing.

## How it works

| Mode | UI | Streams |
|------|----|---------|
| `electron:dev` | Next.js on port 4173 | Next `/api/stream` |
| Packaged `.app` | Static files in `out/` served locally | Same proxy in Electron main process |

HTTP-only stations (2SER, ADRN, etc.) go through the local proxy so there is no mixed-content block.
