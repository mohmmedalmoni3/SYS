"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useCountUp — animates a number from 0 to `target` with an ease-out curve.
 * Respects `prefers-reduced-motion` (jumps straight to the value).
 *
 * @example
 * const value = useCountUp(1284, { duration: 1400 });
 * return <span className="num">{value.toLocaleString("en-US")}</span>;
 */
export function useCountUp(
  target: number,
  { duration = 1200, start = 0, enabled = true }: { duration?: number; start?: number; enabled?: boolean } = {},
) {
  const [value, setValue] = useState(start);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const from = start;
    const delta = target - from;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(from + delta * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration, start, enabled]);

  return Math.round(value);
}

/**
 * useScrollProgress — document scroll completion from 0 → 1.
 * Used by the top progress rail and reading progress in articles.
 *
 * @example
 * const progress = useScrollProgress();
 * <div style={{ transform: `scaleX(${progress})` }} className="fixed top-0 h-0.5" />;
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / scrollable)));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return progress;
}

/**
 * useViewTransition — wraps a state update inside the View Transitions API
 * when supported, falling back to a normal update elsewhere.
 *
 * @example
 * const transition = useViewTransition();
 * transition(() => setView("kanban"));
 */
export function useViewTransition() {
  return useCallback((update: () => void) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (typeof doc.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(update);
    } else {
      update();
    }
  }, []);
}

/**
 * useReducedMotion — boolean flag, safe during SSR.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);
  return reduced;
}
