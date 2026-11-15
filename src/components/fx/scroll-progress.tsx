"use client";

import { useScrollProgress } from "@/hooks/use-motion";

export function ScrollProgressBar() {
  const progress = useScrollProgress();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent" aria-hidden>
      <div
        className="h-full origin-right bg-gradient-to-l from-primary via-primary-soft to-primary-2 shadow-[0_0_12px_var(--primary-2)]"
        style={{ transform: `scaleX(${progress})`, transition: "transform 0.1s linear" }}
      />
    </div>
  );
}
