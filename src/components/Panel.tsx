type PanelProps = {
  title?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, hint, children, className = "" }: PanelProps) {
  return (
    <section
      className={
        "relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]/70 scanline " +
        className
      }
    >
      {title ? (
        <header className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            <span className="text-[var(--accent)]">┌─</span>
            <span>{title}</span>
          </div>
          {hint ? (
            <span className="text-[10px] text-[var(--muted)]">{hint}</span>
          ) : null}
        </header>
      ) : null}
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}
