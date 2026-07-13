"use client";

import { useEffect, useState } from "react";

export function Clock() {
  const [t, setT] = useState<string>("");
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      const s = String(d.getSeconds()).padStart(2, "0");
      setT(`${h}:${m}:${s}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="tabular-nums text-[10px] text-[var(--muted)]">
      {t || "--:--:--"}
      <span className="blink text-[var(--accent)]">_</span>
    </span>
  );
}
