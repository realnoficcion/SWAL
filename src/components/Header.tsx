import Link from "next/link";

type HeaderProps = {
  crumb?: string;
  right?: React.ReactNode;
};

export function Header({ crumb, right }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="text-[var(--accent)] text-sm">╱╱</span>
          <span className="text-lg font-bold tracking-[0.2em] text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
            SWAL
          </span>
          {crumb ? (
            <span className="hidden sm:inline text-xs text-[var(--muted)]">
              / {crumb}
            </span>
          ) : null}
        </Link>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--muted)]">
          {right}
          <span className="hidden sm:inline">ny.us</span>
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-2)] shadow-[0_0_10px_rgba(74,222,128,0.7)]" />
        </div>
      </div>
    </header>
  );
}
