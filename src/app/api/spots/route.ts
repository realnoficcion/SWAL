import { NextResponse } from "next/server";
import { getChildSpots, isFeaturedSpot, searchSpots } from "@/lib/spots";
import type { Spot } from "@/lib/spots";
import { fetchLatestBuoy, fetchLatestSpec } from "@/lib/noaa";
import { fetchOpenMeteoBuoy, fetchOpenMeteoSpec } from "@/lib/openmeteo";
import { rateConditions } from "@/lib/rating";

export const revalidate = 300;

async function fetchForSpot(spot: Spot) {
  if (spot.provider !== "ndbc") {
    const [buoy, spec] = await Promise.all([
      fetchOpenMeteoBuoy(spot.lat, spot.lon).catch(() => null),
      fetchOpenMeteoSpec(spot.lat, spot.lon).catch(() => null),
    ]);
    return { buoy, spec };
  }
  if (!spot.buoy) return { buoy: null, spec: null };
  const [buoy, spec] = await Promise.all([
    fetchLatestBuoy(spot.buoy).catch(() => null),
    fetchLatestSpec(spot.buoy).catch(() => null),
  ]);
  return { buoy, spec };
}

export async function GET(req: Request) {
  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  const matches = query ? searchSpots(query) : searchSpots("");
  // A broad search (for example, "Brazil") can match many spots. Fetching
  // live data for a bounded set keeps the public marine APIs responsive.
  const selected = (query ? matches : matches.filter(isFeaturedSpot)).slice(0, 30);
  const spots = await Promise.all(
    selected.map(async (spot) => {
      const { buoy, spec } = await fetchForSpot(spot);
      const rating = rateConditions({
        waveHeightM: buoy?.waveHeightM ?? spec?.significantWaveHeightM ?? null,
        dominantPeriodS: buoy?.dominantPeriodS ?? spec?.swellPeriodS ?? null,
        windSpeedMs: buoy?.windSpeedMs ?? null,
      });
      const children = getChildSpots(spot.id);
      return {
        ...spot,
        ...(children.length ? { children } : {}),
        buoyData: buoy,
        specData: spec,
        rating,
      };
    }),
  );

  return NextResponse.json({
    spots,
    total: matches.length,
    ts: new Date().toISOString(),
  });
}
