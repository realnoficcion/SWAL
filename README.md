# SWAL

**S**urf/**W**aleska for **AL**l NY breaks.

Waleska's private surf console. Zero ads, zero paywall — just the same public
NOAA data the paid apps repackage.

## What it does

- Lists NY surf spots (Rockaway, Long Beach, Lido, Gilgo, Fire Island, Ditch Plains)
- Pulls **live buoy** wave height / period / direction / wind from the
  [NDBC realtime2](https://www.ndbc.noaa.gov/) feed
- Decomposes **primary swell vs. wind wave** from `.spec` files
- Pulls **tide predictions** from [NOAA CO-OPS](https://tidesandcurrents.noaa.gov/)
- Pulls **24 h wind forecast** from [NWS api.weather.gov](https://www.weather.gov/)
- Scores each spot `flat / poor / fair / good / firing` from wave, period, wind

## Stack

- Next.js 16 (App Router, RSC)
- Tailwind v4
- Deployed on Vercel
- No auth, no DB, no tracking

## Dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy

```bash
vercel --prod
```

## Data sources

| Source | Endpoint |
|--------|----------|
| Buoy realtime | `https://www.ndbc.noaa.gov/data/realtime2/{station}.txt` |
| Swell spec | `https://www.ndbc.noaa.gov/data/realtime2/{station}.spec` |
| Tides | `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` |
| Wind forecast | `https://api.weather.gov/points/{lat},{lon}` |

Data is cached for 5 min on the server (Next `revalidate: 300`).
