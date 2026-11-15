"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

/**
 * Lightweight Lenis scrolling. Automatically disabled for reduced motion and
 * touch-first devices, where native scrolling is already smooth.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/sign-in") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      duration: 0.75,
      smoothWheel: true,
      wheelMultiplier: 1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    return () => {
      lenis.destroy();
    };
  }, [pathname]);

  return null;
}
