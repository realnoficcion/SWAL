type StatProps = {
  label: string;
  value: string;
  sub?: string;
  color?: string;
};

export function Stat({ label, value, sub, color }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
        {label}
      </span>
      <span
        className="text-2xl font-bold leading-none tabular-nums"
        style={{ color: color ?? "var(--text)" }}
      >
        {value}
      </span>
      {sub ? (
        <span className="text-[11px] text-[var(--muted)] tabular-nums">
          {sub}
        </span>
      ) : null}
    </div>
  );
}
