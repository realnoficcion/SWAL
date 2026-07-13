import type { Rating } from "@/lib/rating";

export function RatingPill({ rating }: { rating: Rating }) {
  const bars = Math.round(rating.score / 10);
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: rating.color, boxShadow: `0 0 12px ${rating.color}` }}
      />
      <span
        className="text-[10px] uppercase tracking-[0.25em] font-bold"
        style={{ color: rating.color }}
      >
        {rating.label}
      </span>
      <span className="hidden xs:inline text-[10px] text-[var(--muted)] tabular-nums">
        {"█".repeat(bars).padEnd(10, "░")}
      </span>
    </div>
  );
}
