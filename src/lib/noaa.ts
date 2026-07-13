import { parseNum } from "./units";

const UA = "swal-surf-app (alexandrelopespohl@gmail.com)";

type FetchOpts = { revalidate?: number };

async function ndbcFetch(url: string, opts: FetchOpts = {}): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: opts.revalidate ?? 300 },
  });
  if (!res.ok) throw new Error(`NDBC ${res.status} on ${url}`);
  return res.text();
}

export type BuoyReading = {
  time: string;
  waveHeightM: number | null;
  dominantPeriodS: number | null;
  avgPeriodS: number | null;
  meanWaveDirDeg: number | null;
  windDirDeg: number | null;
  windSpeedMs: number | null;
  gustMs: number | null;
  waterTempC: number | null;
  airTempC: number | null;
  pressureHpa: number | null;
};

export type SpecReading = {
  time: string;
  significantWaveHeightM: number | null;
  swellHeightM: number | null;
  swellPeriodS: number | null;
  swellDirDeg: number | null;
  windWaveHeightM: number | null;
  windWavePeriodS: number | null;
  windWaveDirDeg: number | null;
  steepness: string | null;
};

function parseRow(headers: string[], cols: string[]): Record<string, string> {
  const rec: Record<string, string> = {};
  headers.forEach((h, i) => { rec[h] = cols[i]; });
  return rec;
}

function toIso(rec: Record<string, string>): string {
  const y = rec.YY ?? rec["#YY"];
  const iso = `${y}-${rec.MM}-${rec.DD}T${rec.hh}:${rec.mm}:00Z`;
  return iso;
}

export async function fetchLatestBuoy(station: string): Promise<BuoyReading | null> {
  const txt = await ndbcFetch(`https://www.ndbc.noaa.gov/data/realtime2/${station}.txt`);
  const lines = txt.split("\n").filter(Boolean);
  if (lines.length < 3) return null;
  const headerLine = lines[0].replace(/^#/, "").trim();
  const headers = headerLine.split(/\s+/);

  for (let i = 2; i < Math.min(lines.length, 15); i++) {
    const cols = lines[i].trim().split(/\s+/);
    const rec = parseRow(headers, cols);
    const wvht = parseNum(rec.WVHT);
    const dpd = parseNum(rec.DPD);
    if (wvht !== null || dpd !== null) {
      return {
        time: toIso(rec),
        waveHeightM: wvht,
        dominantPeriodS: dpd,
        avgPeriodS: parseNum(rec.APD),
        meanWaveDirDeg: parseNum(rec.MWD),
        windDirDeg: parseNum(rec.WDIR),
        windSpeedMs: parseNum(rec.WSPD),
        gustMs: parseNum(rec.GST),
        waterTempC: parseNum(rec.WTMP),
        airTempC: parseNum(rec.ATMP),
        pressureHpa: parseNum(rec.PRES),
      };
    }
  }

  const cols = lines[2].trim().split(/\s+/);
  const rec = parseRow(headers, cols);
  return {
    time: toIso(rec),
    waveHeightM: parseNum(rec.WVHT),
    dominantPeriodS: parseNum(rec.DPD),
    avgPeriodS: parseNum(rec.APD),
    meanWaveDirDeg: parseNum(rec.MWD),
    windDirDeg: parseNum(rec.WDIR),
    windSpeedMs: parseNum(rec.WSPD),
    gustMs: parseNum(rec.GST),
    waterTempC: parseNum(rec.WTMP),
    airTempC: parseNum(rec.ATMP),
    pressureHpa: parseNum(rec.PRES),
  };
}

export async function fetchLatestSpec(station: string): Promise<SpecReading | null> {
  try {
    const txt = await ndbcFetch(`https://www.ndbc.noaa.gov/data/realtime2/${station}.spec`);
    const lines = txt.split("\n").filter(Boolean);
    if (lines.length < 3) return null;
    const headers = lines[0].replace(/^#/, "").trim().split(/\s+/);
    const cols = lines[2].trim().split(/\s+/);
    const rec = parseRow(headers, cols);
    return {
      time: toIso(rec),
      significantWaveHeightM: parseNum(rec.WVHT),
      swellHeightM: parseNum(rec.SwH),
      swellPeriodS: parseNum(rec.SwP),
      swellDirDeg: parseNum(rec.SwD) ?? null,
      windWaveHeightM: parseNum(rec.WWH),
      windWavePeriodS: parseNum(rec.WWP),
      windWaveDirDeg: parseNum(rec.WWD),
      steepness: rec.STEEPNESS && rec.STEEPNESS !== "N/A" ? rec.STEEPNESS : null,
    };
  } catch {
    return null;
  }
}

export type TideEvent = { time: string; heightFt: number; type: "H" | "L" };

export async function fetchTides(station: string, days = 2): Promise<TideEvent[]> {
  const events: TideEvent[] = [];
  const today = new Date();
  for (let d = 0; d < days; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&date=${dateStr === today.toISOString().slice(0, 10).replace(/-/g, "") ? "today" : "latest"}&begin_date=${dateStr}&range=24`;
    try {
      const res = await fetch(
        `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?station=${station}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json&begin_date=${dateStr}&range=24`,
        { next: { revalidate: 3600 }, headers: { "User-Agent": UA } },
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data.predictions)) {
        for (const p of data.predictions) {
          events.push({ time: p.t, heightFt: parseFloat(p.v), type: p.type });
        }
      }
    } catch {
      continue;
    }
  }
  return events;
}

export type HourlyForecast = {
  time: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  temperatureF: number;
};

export async function fetchWindForecast(lat: number, lon: number): Promise<HourlyForecast[]> {
  try {
    const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { "User-Agent": UA, Accept: "application/geo+json" },
      next: { revalidate: 86400 },
    });
    if (!pointRes.ok) return [];
    const point = await pointRes.json();
    const forecastUrl = point?.properties?.forecastHourly;
    if (!forecastUrl) return [];
    const fcRes = await fetch(forecastUrl, {
      headers: { "User-Agent": UA, Accept: "application/geo+json" },
      next: { revalidate: 1800 },
    });
    if (!fcRes.ok) return [];
    const fc = await fcRes.json();
    const periods = fc?.properties?.periods ?? [];
    return periods.slice(0, 24).map((p: {
      startTime: string;
      windSpeed: string;
      windDirection: string;
      shortForecast: string;
      temperature: number;
    }) => ({
      time: p.startTime,
      windSpeed: p.windSpeed,
      windDirection: p.windDirection,
      shortForecast: p.shortForecast,
      temperatureF: p.temperature,
    }));
  } catch {
    return [];
  }
}
