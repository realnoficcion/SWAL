"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RatingPill } from "./RatingPill";
import { degToCompass, metersToFeet, msToMph } from "@/lib/units";
import type { Spot } from "@/lib/spots";
import type { BuoyReading, SpecReading } from "@/lib/noaa";
import type { Rating } from "@/lib/rating";

type SpotWithData = Spot & {
  buoyData: BuoyReading | null;
  specData: SpecReading | null;
  rating: Rating;
};

type Props = { spots: SpotWithData[] };

const REGION_KEYS: Record<string, string[]> = {
  ny: ["ny", "new york", "nyc"],
  floripa: ["floripa", "florianópolis", "florianopolis", "brasil", "brazil", "santa catarina", "sc"],
};

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatWave(m: number | null): string {
  if (m == null) return "—";
  return `${metersToFeet(m).toFixed(1)}ft`;
}

function formatWind(ms: number | null, dir: number | null): string {
  if (ms == null) return "—";
  const mph = msToMph(ms).toFixed(0);
  const d = dir != null ? degToCompass(dir) : "";
  return `${mph}mph ${d}`.trim();
}

export function SpotsBrowser({ spots }: Props) {
  const [query, setQuery] = useState<string>("");
  const [filter, setFilter] = useState<string>("all");

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const s of spots) set.add(s.country);
    return ["all", ...Array.from(set).sort()];
  }, [spots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qn = normalize(q);
    let out = spots;
    if (filter !== "all") out = out.filter((s) => s.country === filter);
    
    // If no query, apply the default restriction
    if (!q) {
      if (filter === "all") {
        return out.filter((s) => s.region.includes(", NY") || s.region.includes(", BR"));
      }
      return out;
    }

    // If there IS a query, search across all spots (ignoring the default restriction)
    return spots.filter((s) => {
      // Direct matches (normalized for accents)
      const matchesDirect =
        normalize(s.name).includes(qn) ||
        normalize(s.region).includes(qn) ||
        normalize(s.id).includes(qn) ||
        normalize(s.faces).includes(qn) ||
        normalize(s.break).includes(qn) ||
        normalize(s.notes).includes(qn);

      if (matchesDirect) return true;

      // Region shortcuts expansion
      for (const [_key, terms] of Object.entries(REGION_KEYS)) {
        // If the query matches a shortcut keyword (e.g., "ny", "floripa")
        if (terms.some((t) => normalize(t).includes(qn))) {
          // Check if the spot belongs to this region expansion
          if (
            terms.some(
              (t) =>
                normalize(s.region).includes(normalize(t)) ||
                normalize(s.name).includes(normalize(t)),
            )
          ) {
            return true;
          }
        }
      }

      return false;
    });
  }, [spots, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, SpotWithData[]>();
    for (const s of filtered) {
      // Group by country/region logic: use "NY" for all NY spots, and "Florianópolis" for all Floripa spots
      let k = s.region;
      if (s.region.includes(", NY")) k = "New York";
      else if (s.region.includes("Florianópolis")) k = "Florianópolis";
      
      const arr = map.get(k) ?? [];
      arr.push(s);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => {
      // Custom sorting: Force New York first, then Florianópolis
      if (a[0] === "New York") return -1;
      if (b[0] === "New York") return 1;
      if (a[0] === "Florianópolis") return -1;
      if (b[0] === "Florianópolis") return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [filtered]);

  return (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] text-xs">
            ▸
          </span>
          <input
            type="search"
            inputMode="search"
            autoComplete="off"
            spellCheck={false}
            placeholder="search spot, region or country..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--panel)]/60 pl-8 pr-3 py-2.5 text-sm font-mono text-[var(--text)] placeholder:text-[var(--muted)]/70 focus:border-[var(--accent)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--accent)] text-xs uppercase tracking-widest"
              aria-label="clear search"
            >
              esc
            </button>
          ) : null}
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--panel)]/40 p-1 text-[10px] uppercase tracking-widest overflow-x-auto no-scrollbar">
          {countries.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap " +
                (filter === f
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]")
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--muted)]">
        <span>▸ {filtered.length} spot{filtered.length === 1 ? "" : "s"}</span>
        {query || filter !== "all" ? (
          <button
            type="button"
            onClick={() => { setQuery(""); setFilter("all"); }}
            className="text-[var(--accent)] hover:underline"
          >
            reset
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)]/40 p-6 text-center text-sm text-[var(--muted)]">
          <p>no spots match &quot;{query}&quot;</p>
          <p className="mt-1 text-[11px]">try: rockaway, joaquina, ditch, floripa</p>
        </div>
      ) : null}

      <div className="space-y-6">
        {grouped.map(([region, list]) => (
          <div key={region}>
            <h3 className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
              <span className="text-[var(--accent)]">▤</span>
              {region}
              <span className="flex-1 border-b border-dashed border-[var(--border)]" />
              <span>{list.length}</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {list.map((s) => (
                <Link
                  key={s.id}
                  href={`/spot/${s.id}`}
                  className="group block rounded-lg border border-[var(--border)] bg-[var(--panel)]/60 p-4 hover-glow transition-all hover:border-[var(--accent)]/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--accent)] text-xs">▸</span>
                        <h2 className="text-base font-bold text-[var(--text)] truncate">
                          {s.name}
                        </h2>
                        <span className="text-[10px] text-[var(--muted)] shrink-0">
                          /{s.region}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--muted)] truncate">
                        {s.provider === "ndbc" ? `buoy ${s.buoy}` : "wave model"}{" "}
                        · faces {s.faces} · {s.break}
                      </p>
                    </div>
                    <RatingPill rating={s.rating} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                        wave
                      </span>
                      <span className="text-lg font-bold tabular-nums text-[var(--text)]">
                        {formatWave(
                          s.buoyData?.waveHeightM ??
                            s.specData?.significantWaveHeightM ??
                            null,
                        )}
                      </span>
                      <span className="text-[10px] text-[var(--muted)] tabular-nums">
                        {(s.buoyData?.waveHeightM ??
                          s.specData?.significantWaveHeightM ??
                          null) != null
                          ? `${(s.buoyData?.waveHeightM ??
                              s.specData?.significantWaveHeightM)!.toFixed(2)}m`
                          : ""}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                        period
                      </span>
                      <span className="text-lg font-bold tabular-nums text-[var(--text)]">
                        {s.buoyData?.dominantPeriodS
                          ? `${s.buoyData.dominantPeriodS.toFixed(0)}s`
                          : "—"}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {s.buoyData?.meanWaveDirDeg != null
                          ? `from ${degToCompass(s.buoyData.meanWaveDirDeg)}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                        wind
                      </span>
                      <span className="text-lg font-bold tabular-nums text-[var(--text)]">
                        {formatWind(
                          s.buoyData?.windSpeedMs ?? null,
                          s.buoyData?.windDirDeg ?? null,
                        )}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {s.buoyData?.gustMs != null
                          ? `gust ${msToMph(s.buoyData.gustMs).toFixed(0)}mph`
                          : ""}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
