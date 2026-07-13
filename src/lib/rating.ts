export type Rating = {
  score: number;
  label: "flat" | "poor" | "fair" | "good" | "firing";
  color: string;
};

export function rateConditions(input: {
  waveHeightM: number | null;
  dominantPeriodS: number | null;
  windSpeedMs: number | null;
}): Rating {
  const { waveHeightM, dominantPeriodS, windSpeedMs } = input;

  if (waveHeightM == null || waveHeightM < 0.3) {
    return { score: 0, label: "flat", color: "#4b5563" };
  }

  let score = 0;

  if (waveHeightM >= 2.0) score += 40;
  else if (waveHeightM >= 1.2) score += 32;
  else if (waveHeightM >= 0.8) score += 22;
  else if (waveHeightM >= 0.5) score += 12;
  else score += 4;

  if (dominantPeriodS != null) {
    if (dominantPeriodS >= 12) score += 40;
    else if (dominantPeriodS >= 10) score += 32;
    else if (dominantPeriodS >= 8) score += 22;
    else if (dominantPeriodS >= 6) score += 12;
    else score += 4;
  }

  if (windSpeedMs != null) {
    if (windSpeedMs < 3) score += 20;
    else if (windSpeedMs < 6) score += 14;
    else if (windSpeedMs < 9) score += 8;
    else if (windSpeedMs < 12) score += 3;
    else score += 0;
  } else {
    score += 8;
  }

  score = Math.min(100, score);

  if (score >= 80) return { score, label: "firing", color: "#22d3ee" };
  if (score >= 60) return { score, label: "good", color: "#4ade80" };
  if (score >= 40) return { score, label: "fair", color: "#facc15" };
  if (score >= 15) return { score, label: "poor", color: "#fb923c" };
  return { score, label: "flat", color: "#4b5563" };
}
