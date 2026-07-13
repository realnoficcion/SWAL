export const M_TO_FT = 3.28084;
export const MS_TO_MPH = 2.23694;
export const MS_TO_KT = 1.94384;

export function metersToFeet(m: number): number {
  return m * M_TO_FT;
}

export function msToMph(ms: number): number {
  return ms * MS_TO_MPH;
}

export function degToCompass(deg: number): string {
  if (Number.isNaN(deg)) return "--";
  const dirs = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW",
  ];
  const i = Math.round(((deg % 360) / 22.5)) % 16;
  return dirs[i];
}

export function cToF(c: number): number {
  return c * 9 / 5 + 32;
}

export function parseNum(v: string | undefined): number | null {
  if (!v || v === "MM" || v === "N/A") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}
