# Stream URL Verification Report

All 19 stations in `stations-seed.json` and `stations.json` have been verified. Updated March 2025.

## ✅ Working (15 stations)

| Station | Stream URL |
|---------|------------|
| 3RRR | https://realtime.rrr.org.au/p1h |
| 2SER | http://138.25.219.25:840/2ser128.MP3 |
| 4ZZZ | https://iheart.4zzz.org.au/4zzz |
| RTRFM | https://live.rtrfm.com.au/stream1 |
| FBi Radio | https://streamer.fbiradio.com/stream |
| Radio Adelaide | https://mediaserviceslive.akamaized.net/hls/live/2038298/localadelaide/index.m3u8 (HLS) |
| 3CR | https://playerservices.streamtheworld.com/api/livestream-redirect/3CR.mp3 |
| JOY 94.9 | https://stream.joy.org.au/proxy/joy949?mp=/live |
| 2XX | https://playerservices.streamtheworld.com/api/livestream-redirect/2XX.mp3 |
| SYN | https://23163.live.streamtheworld.com/3SYNAAC_SC (AAC) |
| Three D Radio | http://sounds.threedradio.com:8000/stream |
| Bay FM | https://playerservices.streamtheworld.com/api/livestream-redirect/2BAY_FM999.mp3 |
| Noongar Radio | https://firstnationsmedia.stream/8028/stream |
| 4EB | https://playerservices.streamtheworld.com/api/livestream-redirect/4EB.mp3 |
| Edge Radio | http://streaming.edgeradio.org.au/radio/8000/stream |

## ⚠️ Unverified — original URLs kept (4 stations)

No working replacement found. Original URLs may work — verify manually:

| Station | Current URL | Notes |
|---------|-------------|-------|
| 3KND | https://streaming.3knd.org.au/3knd | Try 3knd.org.au for listen link |
| 2NBC | https://streaming.2nbc.org.au/2nbc | Try 2nbc.org.au or 901nbcfm.com.au |
| CAAMA | https://streaming.caama.com.au/caama | Try caama.com.au |
| Skid Row | https://streaming.skidrow.org.au/skidrow | Try skidrow.org.au |

## Format notes

- **Radio Adelaide** uses HLS (`.m3u8`). Works in Safari natively; Chrome/Firefox need HLS.js.
- **SYN** uses AAC. May work in Safari; other browsers may need fallback.
- **2SER** uses HTTP (not HTTPS). May cause mixed-content issues when app is on HTTPS.
- **Three D Radio** and **Edge Radio** use HTTP.

## Re-verification

Stream URLs change. To re-verify:

```bash
# Test a URL
curl -I --max-time 5 "https://realtime.rrr.org.au/p1h"
```

Or use the [Radio Browser API](https://www.radio-browser.info/webservice) to find updated URLs for Australian stations.
