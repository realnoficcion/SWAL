import { headers } from "next/headers";
import { Header } from "@/components/Header";
import { Panel } from "@/components/Panel";
import { Clock } from "@/components/Clock";
import { SpotsBrowser } from "@/components/SpotsBrowser";
import type { Spot } from "@/lib/spots";
import type { BuoyReading, SpecReading } from "@/lib/noaa";
import type { Rating } from "@/lib/rating";

export const revalidate = 300;

type SpotWithData = Spot & {
  buoyData: BuoyReading | null;
  specData: SpecReading | null;
  rating: Rating;
};

async function getData(): Promise<{ spots: SpotWithData[]; ts: string }> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  const res = await fetch(`${proto}://${host}/api/spots`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) return { spots: [], ts: new Date().toISOString() };
  return res.json();
}

export default async function Home() {
  const { spots, ts } = await getData();
  const updated = new Date(ts);
  const upStr = updated.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16">
      <Header right={<Clock />} />

      <section className="mt-6 mb-6 grid-bg rounded-lg border border-[var(--border)] bg-[var(--panel)]/40 p-5 scanline">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--muted)]">
              &gt; user: waleska • loc: global
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
              hey wal.{" "}
              <span className="text-[var(--accent)]">is it on today?</span>
            </h1>
            <p className="mt-2 text-xs text-[var(--muted)]">
              real-time swell / wind / tide from{" "}
              <span className="text-[var(--accent-2)]">NOAA</span> &{" "}
              <span className="text-[var(--accent-2)]">open-meteo</span>{" "}
              <span className="hidden sm:inline">— open marine data.</span>
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end text-[10px] text-[var(--muted)] shrink-0">
            <span>upd {upStr}</span>
            <span>src ndbc + co-ops + nws + om</span>
          </div>
        </div>
      </section>

      <SpotsBrowser spots={spots} />

      <Panel title="legend" className="mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          {[
            { l: "flat", c: "#4b5563" },
            { l: "poor", c: "#fb923c" },
            { l: "fair", c: "#facc15" },
            { l: "good", c: "#4ade80" },
            { l: "firing", c: "#22d3ee" },
          ].map((x) => (
            <div key={x.l} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: x.c, boxShadow: `0 0 8px ${x.c}` }}
              />
              <span className="uppercase tracking-widest text-[var(--muted)]">
                {x.l}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <footer className="mt-6 text-center text-[10px] text-[var(--muted)]">
        <p>
          data:{" "}
          <a
            className="underline hover:text-[var(--accent)]"
            href="https://www.ndbc.noaa.gov/"
            target="_blank"
            rel="noreferrer"
          >
            NDBC
          </a>{" "}
          ·{" "}
          <a
            className="underline hover:text-[var(--accent)]"
            href="https://tidesandcurrents.noaa.gov/"
            target="_blank"
            rel="noreferrer"
          >
            CO-OPS
          </a>{" "}
          ·{" "}
          <a
            className="underline hover:text-[var(--accent)]"
            href="https://www.weather.gov/"
            target="_blank"
            rel="noreferrer"
          >
            NWS
          </a>{" "}
          ·{" "}
          <a
            className="underline hover:text-[var(--accent)]"
            href="https://open-meteo.com/en/docs/marine-weather-api"
            target="_blank"
            rel="noreferrer"
          >
            Open-Meteo
          </a>
        </p>
      </footer>
    </div>
  );
}
