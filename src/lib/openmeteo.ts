import type { BuoyReading, SpecReading, HourlyForecast } from "./noaa";

const UA = "swal-surf-app (alexandrelopespohl@gmail.com)";

type MarineCurrent = {
  time: string;
  wave_height: number | null;
  wave_period: number | null;
  wave_direction: number | null;
  swell_wave_height: number | null;
  swell_wave_period: number | null;
  swell_wave_direction: number | null;
  wind_wave_height: number | null;
  wind_wave_period: number | null;
  wind_wave_direction: number | null;
};

type MarineResp = { current?: MarineCurrent };

type WindCurrent = {
  time: string;
  wind_speed_10m: number | null;
  wind_direction_10m: number | null;
  wind_gusts_10m: number | null;
  temperature_2m: number | null;
};

type WindHourly = {
  time: string[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  temperature_2m: number[];
};

type WindResp = { current?: WindCurrent; hourly?: WindHourly };

export async function fetchOpenMeteoBuoy(
  lat: number,
  lon: number,
): Promise<BuoyReading | null> {
  try {
    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction&cell_selection=sea&timezone=UTC`;
    const windUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,temperature_2m&wind_speed_unit=ms&timezone=UTC`;

    const [marineRes, windRes] = await Promise.all([
      fetch(marineUrl, {
        headers: { "User-Agent": UA },
        next: { revalidate: 900 },
      }),
      fetch(windUrl, {
        headers: { "User-Agent": UA },
        next: { revalidate: 900 },
      }),
    ]);

    const marine = marineRes.ok ? ((await marineRes.json()) as MarineResp) : null;
    const wind = windRes.ok ? ((await windRes.json()) as WindResp) : null;

    const mc = marine?.current;
    const wc = wind?.current;

    if (!mc && !wc) return null;

    return {
      time: mc?.time ?? wc?.time ?? new Date().toISOString(),
      waveHeightM: mc?.wave_height ?? null,
      dominantPeriodS: mc?.swell_wave_period ?? mc?.wave_period ?? null,
      avgPeriodS: mc?.wave_period ?? null,
      meanWaveDirDeg: mc?.wave_direction ?? null,
      windDirDeg: wc?.wind_direction_10m ?? null,
      windSpeedMs: wc?.wind_speed_10m ?? null,
      gustMs: wc?.wind_gusts_10m ?? null,
      waterTempC: null,
      airTempC: wc?.temperature_2m ?? null,
      pressureHpa: null,
    };
  } catch {
    return null;
  }
}

export async function fetchOpenMeteoSpec(
  lat: number,
  lon: number,
): Promise<SpecReading | null> {
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,swell_wave_height,swell_wave_period,swell_wave_direction,wind_wave_height,wind_wave_period,wind_wave_direction&cell_selection=sea&timezone=UTC`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 900 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as MarineResp;
    const c = data.current;
    if (!c) return null;
    return {
      time: c.time,
      significantWaveHeightM: c.wave_height,
      swellHeightM: c.swell_wave_height,
      swellPeriodS: c.swell_wave_period,
      swellDirDeg: c.swell_wave_direction,
      windWaveHeightM: c.wind_wave_height,
      windWavePeriodS: c.wind_wave_period,
      windWaveDirDeg: c.wind_wave_direction,
      steepness: null,
    };
  } catch {
    return null;
  }
}

export async function fetchOpenMeteoWindForecast(
  lat: number,
  lon: number,
): Promise<HourlyForecast[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=wind_speed_10m,wind_direction_10m,temperature_2m&wind_speed_unit=ms&temperature_unit=fahrenheit&timezone=UTC&forecast_days=2`;
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as WindResp;
    const h = data.hourly;
    if (!h) return [];

    const now = Date.now();
    const out: HourlyForecast[] = [];
    for (let i = 0; i < h.time.length && out.length < 24; i++) {
      const t = new Date(h.time[i] + "Z").getTime();
      if (t < now - 60 * 60 * 1000) continue;
      const spdMs = h.wind_speed_10m[i];
      const mph = Math.round(spdMs * 2.23694);
      out.push({
        time: new Date(t).toISOString(),
        windSpeed: `${mph} mph`,
        windDirection: degToCompass(h.wind_direction_10m[i]),
        shortForecast: "",
        temperatureF: Math.round(h.temperature_2m[i]),
      });
    }
    return out;
  } catch {
    return [];
  }
}

function degToCompass(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}
