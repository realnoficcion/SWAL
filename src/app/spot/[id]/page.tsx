import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { Header } from "@/components/Header";
import { Panel } from "@/components/Panel";
import { Stat } from "@/components/Stat";
import { RatingPill } from "@/components/RatingPill";
import { Clock } from "@/components/Clock";
import { getSpot } from "@/lib/spots";
import {
  degToCompass,
  metersToFeet,
  msToMph,
  cToF,
} from "@/lib/units";
import type { BuoyReading, SpecReading, TideEvent, HourlyForecast } from "@/lib/noaa";
import type { Rating } from "@/lib/rating";
import type { Spot } from "@/lib/spots";

export const revalidate = 300;

type Payload = {
  spot: Spot;
  buoy: BuoyReading | null;
  spec: SpecReading | null;
  regionalBuoy: BuoyReading | null;
  tides: TideEvent[];
  windForecast: HourlyForecast[];
  rating: Rating;
  ts: string;
};

async function getSpotData(id: string): Promise<Payload | null> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const res = await fetch(`${proto}://${host}/api/spot/${id}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  return res.json();
}

function fmtWave(m: number | null): string {
  if (m == null) return "—";
  return `${metersToFeet(m).toFixed(1)}ft`;
}

function fmtSec(s: number | null): string {
  return s == null ? "—" : `${s.toFixed(0)}s`;
}

function fmtDir(d: number | null): string {
  return d == null ? "—" : `${degToCompass(d)} ${d.toFixed(0)}°`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "2-digit",
  });
}

function fmtHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  }).padStart(2, "0");
}

export default async function SpotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "rockaway") redirect("/spot/rockaway-90");
  const spot = getSpot(id);
  if (!spot) return notFound();

  const data = await getSpotData(id);
  if (!data) return notFound();

  const { buoy, spec, regionalBuoy, tides, windForecast, rating, ts } = data;
  const usesLocalModel = spot.provider !== "ndbc";
  const updated = new Date(ts);
  const upStr = updated.toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
  });

  const waveM = buoy?.waveHeightM ?? spec?.significantWaveHeightM ?? null;
  const swellDir = spec?.swellDirDeg ?? buoy?.meanWaveDirDeg ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Header crumb={spot.id} right={<Clock />} />

      <div className="mt-4 mb-3">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-widest text-[var(--muted)] hover:text-[var(--accent)]"
        >
          ← back
        </Link>
      </div>

      <section className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--panel)]/60 p-4 grid-bg scanline">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">
              /spot/{spot.id}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {spot.name}
            </h1>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {spot.region} · {spot.lat.toFixed(3)}, {spot.lon.toFixed(3)}
            </p>
          </div>
          <RatingPill rating={rating} />
        </div>
        <p className="mt-3 text-[12px] text-[var(--text)]/80 leading-relaxed">
          {spot.notes}
        </p>
      </section>

      <Panel
        title="now // wave"
        hint={usesLocalModel ? "open-meteo local model" : buoy?.time ? fmtTime(buoy.time) : "no data"}
        className="mb-4"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat
            label="height"
            value={fmtWave(waveM)}
            sub={waveM != null ? `${waveM.toFixed(2)}m` : ""}
            color="var(--accent)"
          />
          <Stat
            label="dom period"
            value={fmtSec(buoy?.dominantPeriodS ?? spec?.swellPeriodS ?? null)}
            sub={buoy?.avgPeriodS != null ? `avg ${buoy.avgPeriodS.toFixed(1)}s` : ""}
          />
          <Stat
            label="from"
            value={fmtDir(swellDir)}
            sub={buoy?.meanWaveDirDeg != null ? "mean wave dir" : ""}
          />
          <Stat
            label="water"
            value={buoy?.waterTempC != null ? `${cToF(buoy.waterTempC).toFixed(0)}°F` : "—"}
            sub={buoy?.waterTempC != null ? `${buoy.waterTempC.toFixed(1)}°C` : ""}
          />
        </div>
      </Panel>

      {spot.provider === "hybrid" && spot.buoy ? (
        <Panel title="regional // buoy reference" hint={`ndbc ${spot.buoy}`} className="mb-4">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="height" value={fmtWave(regionalBuoy?.waveHeightM ?? null)} />
            <Stat label="period" value={fmtSec(regionalBuoy?.dominantPeriodS ?? null)} />
            <Stat label="from" value={fmtDir(regionalBuoy?.meanWaveDirDeg ?? null)} />
          </div>
        </Panel>
      ) : null}

      {spec && (spec.swellHeightM != null || spec.windWaveHeightM != null) ? (
        <Panel
          title="swell // decomposed"
          hint={usesLocalModel ? "open-meteo local model" : "ndbc.spec"}
          className="mb-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-[var(--border)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">
                primary swell
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">height</span>
                  <span className="tabular-nums">{fmtWave(spec.swellHeightM)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">period</span>
                  <span className="tabular-nums">{fmtSec(spec.swellPeriodS)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">from</span>
                  <span className="tabular-nums">{fmtDir(spec.swellDirDeg)}</span>
                </div>
              </div>
            </div>
            <div className="rounded border border-[var(--border)] p-3">
              <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] mb-2">
                wind wave
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">height</span>
                  <span className="tabular-nums">{fmtWave(spec.windWaveHeightM)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">period</span>
                  <span className="tabular-nums">{fmtSec(spec.windWavePeriodS)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">from</span>
                  <span className="tabular-nums">{fmtDir(spec.windWaveDirDeg)}</span>
                </div>
              </div>
            </div>
          </div>
          {spec.steepness ? (
            <p className="mt-3 text-[11px] text-[var(--muted)]">
              steepness: <span className="text-[var(--text)]">{spec.steepness}</span>
            </p>
          ) : null}
        </Panel>
      ) : null}

      <Panel
        title="wind // now"
        hint={usesLocalModel ? "open-meteo local model" : `buoy ${spot.buoy}`}
        className="mb-4"
      >
        <div className="grid grid-cols-3 gap-4">
          <Stat
            label="speed"
            value={buoy?.windSpeedMs != null ? `${msToMph(buoy.windSpeedMs).toFixed(0)}mph` : "—"}
            sub={buoy?.windSpeedMs != null ? `${buoy.windSpeedMs.toFixed(1)}m/s` : ""}
          />
          <Stat
            label="gust"
            value={buoy?.gustMs != null ? `${msToMph(buoy.gustMs).toFixed(0)}mph` : "—"}
          />
          <Stat
            label="from"
            value={fmtDir(buoy?.windDirDeg ?? null)}
          />
        </div>
      </Panel>

      {windForecast.length > 0 ? (
        <Panel
          title="forecast // next 24h"
          hint={usesLocalModel ? "open-meteo" : "nws hourly"}
          className="mb-4"
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {windForecast.slice(0, 12).map((h) => (
              <div
                key={h.time}
                className="min-w-[74px] rounded border border-[var(--border)] bg-[var(--bg-2)]/60 p-2 text-center"
              >
                <div className="text-[10px] text-[var(--muted)]">{fmtHour(h.time)}h</div>
                <div className="mt-1 text-sm font-bold tabular-nums text-[var(--text)]">
                  {h.temperatureF}°
                </div>
                <div className="text-[10px] text-[var(--accent-2)] mt-1 leading-tight">
                  {h.windSpeed}
                </div>
                <div className="text-[10px] text-[var(--muted)]">{h.windDirection}</div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tides.length > 0 && spot.tideStation ? (
        <Panel title={`tides // ${spot.tideStation}`} hint="co-ops mllw" className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            {tides.slice(0, 8).map((t) => (
              <div
                key={t.time + t.type}
                className="flex items-center justify-between rounded border border-[var(--border)] bg-[var(--bg-2)]/40 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      background:
                        t.type === "H" ? "var(--accent)" : "var(--warn)",
                      boxShadow: `0 0 8px ${t.type === "H" ? "#22d3ee" : "#facc15"}`,
                    }}
                  />
                  <span className="text-[11px] uppercase tracking-widest text-[var(--muted)]">
                    {t.type === "H" ? "high" : "low"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm tabular-nums text-[var(--text)]">
                    {new Date(t.time.replace(" ", "T")).toLocaleString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "2-digit",
                    })}
                  </div>
                  <div className="text-[10px] tabular-nums text-[var(--muted)]">
                    {t.heightFt.toFixed(2)}ft
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel
        title="raw // source"
        hint={usesLocalModel ? "open-meteo local model" : `ndbc ${spot.buoy}`}
      >
        <pre className="overflow-x-auto text-[11px] leading-relaxed text-[var(--muted)] whitespace-pre">
{`source     : ${usesLocalModel ? "open-meteo local marine model" : `ndbc buoy ${spot.buoy}`}
regional    : ${regionalBuoy && spot.buoy ? `ndbc buoy ${spot.buoy}` : "n/a"}
regional m  : ${regionalBuoy?.waveHeightM ?? "--"}
regional s  : ${regionalBuoy?.dominantPeriodS ?? "--"}
regional dir: ${regionalBuoy?.meanWaveDirDeg ?? "--"}
tide       : ${spot.tideStation ?? "n/a"}
lat,lon    : ${spot.lat.toFixed(4)}, ${spot.lon.toFixed(4)}
wave (m)   : ${buoy?.waveHeightM ?? "--"}
dom (s)    : ${buoy?.dominantPeriodS ?? "--"}
avg (s)    : ${buoy?.avgPeriodS ?? "--"}
mwd (°)    : ${buoy?.meanWaveDirDeg ?? "--"}
wind (m/s) : ${buoy?.windSpeedMs ?? "--"} from ${buoy?.windDirDeg ?? "--"}°
gust (m/s) : ${buoy?.gustMs ?? "--"}
water (°C) : ${buoy?.waterTempC ?? "--"}
air   (°C) : ${buoy?.airTempC ?? "--"}
pres (hPa) : ${buoy?.pressureHpa ?? "--"}
obs time   : ${buoy?.time ?? "--"}
served at  : ${upStr} ET`}
        </pre>
      </Panel>

      <footer className="mt-6 text-center text-[10px] text-[var(--muted)]">
        {!usesLocalModel && spot.buoy ? (
          <a
            className="underline hover:text-[var(--accent)]"
            href={`https://www.ndbc.noaa.gov/station_page.php?station=${spot.buoy}`}
            target="_blank"
            rel="noreferrer"
          >
            view buoy {spot.buoy} on ndbc →
          </a>
        ) : spot.provider === "hybrid" && spot.buoy ? (
          <>
            <a
              className="underline hover:text-[var(--accent)]"
              href={`https://open-meteo.com/en/docs/marine-weather-api#latitude=${spot.lat}&longitude=${spot.lon}`}
              target="_blank"
              rel="noreferrer"
            >
              wave source: open-meteo marine (noaa ww3)
            </a>
            <span> · </span>
            <a
              className="underline hover:text-[var(--accent)]"
              href={`https://www.ndbc.noaa.gov/station_page.php?station=${spot.buoy}`}
              target="_blank"
              rel="noreferrer"
            >
              regional buoy {spot.buoy}
            </a>
            <span> →</span>
          </>
        ) : (
          <a
            className="underline hover:text-[var(--accent)]"
            href={`https://open-meteo.com/en/docs/marine-weather-api#latitude=${spot.lat}&longitude=${spot.lon}`}
            target="_blank"
            rel="noreferrer"
          >
            wave source: open-meteo marine (noaa ww3) →
          </a>
        )}
      </footer>
    </div>
  );
}
