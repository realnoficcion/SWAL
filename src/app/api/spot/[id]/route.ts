import { NextResponse } from "next/server";
import { getSpot } from "@/lib/spots";
import {
  fetchLatestBuoy,
  fetchLatestSpec,
  fetchTides,
  fetchWindForecast,
} from "@/lib/noaa";
import {
  fetchOpenMeteoBuoy,
  fetchOpenMeteoSpec,
  fetchOpenMeteoWindForecast,
} from "@/lib/openmeteo";
import { rateConditions } from "@/lib/rating";

export const revalidate = 300;

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  if (id === "rockaway") {
    return NextResponse.redirect(new URL("/api/spot/rockaway-90", req.url));
  }
  const spot = getSpot(id);
  if (!spot) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const usesLocalModel = spot.provider !== "ndbc";
  const usesRegionalBuoy = spot.provider === "hybrid";

  const [buoy, spec, tides, windForecast, regionalBuoy] = await Promise.all([
    usesLocalModel
      ? fetchOpenMeteoBuoy(spot.lat, spot.lon).catch(() => null)
      : spot.buoy
        ? fetchLatestBuoy(spot.buoy).catch(() => null)
        : Promise.resolve(null),
    usesLocalModel
      ? fetchOpenMeteoSpec(spot.lat, spot.lon).catch(() => null)
      : spot.buoy
        ? fetchLatestSpec(spot.buoy).catch(() => null)
        : Promise.resolve(null),
    spot.tideStation
      ? fetchTides(spot.tideStation, 2).catch(() => [])
      : Promise.resolve([]),
    usesLocalModel
      ? fetchOpenMeteoWindForecast(spot.lat, spot.lon).catch(() => [])
      : fetchWindForecast(spot.lat, spot.lon).catch(() => []),
    usesRegionalBuoy && spot.buoy
      ? fetchLatestBuoy(spot.buoy).catch(() => null)
      : Promise.resolve(null),
  ]);

  const rating = rateConditions({
    waveHeightM: buoy?.waveHeightM ?? spec?.significantWaveHeightM ?? null,
    dominantPeriodS: buoy?.dominantPeriodS ?? spec?.swellPeriodS ?? null,
    windSpeedMs: buoy?.windSpeedMs ?? null,
  });

  return NextResponse.json({
    spot,
    buoy,
    spec,
    regionalBuoy,
    tides,
    windForecast,
    rating,
    ts: new Date().toISOString(),
  });
}
