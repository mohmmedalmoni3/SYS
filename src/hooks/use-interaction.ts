"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * useSpotlight — writes the pointer position into CSS variables (`--mx`, `--my`)
 * so a radial highlight can follow the cursor with zero React re-renders.
 *
 * @example
 * const ref = useSpotlight<HTMLDivElement>();
 * return <div ref={ref} className="spotlight glass">...</div>;
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>(enabled = true) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const handleMove = (event: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect();
        element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        element.style.setProperty("--my", `${event.clientY - rect.top}px`);
        frame = 0;
      });
    };

    element.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      element.removeEventListener("pointermove", handleMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return ref;
}

/**
 * useMagnetic — pulls an element toward the cursor inside a radius, then
 * springs back on leave. Great for primary CTAs and icon buttons.
 *
 * @example
 * const ref = useMagnetic<HTMLButtonElement>(0.25);
 * return <button ref={ref} className="btn btn-primary">أنشئ مشروعاً</button>;
 */
export function useMagnetic<T extends HTMLElement = HTMLButtonElement>(strength = 0.2) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        element.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      element.style.transition = "transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
      element.style.transform = "translate3d(0,0,0)";
    };
    const enter = () => {
      element.style.transition = "transform 0.12s ease-out";
    };

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  return ref;
}

/**
 * useTilt3D — subtle 3D tilt on hover using rotateX / rotateY and a glare
 * overlay. Disabled for touch devices and reduced-motion users.
 *
 * @example
 * const ref = useTilt3D<HTMLDivElement>(7);
 * return <div ref={ref} className="glass rounded-3xl">...</div>;
 */
export function useTilt3D<T extends HTMLElement = HTMLDivElement>(maxDegrees = 6) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    const reset = () => {
      element.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
      element.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
    };

    const move = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      element.style.transition = "transform 0.08s linear";
      element.style.transform = `perspective(900px) rotateX(${(-py * maxDegrees).toFixed(2)}deg) rotateY(${(px * maxDegrees).toFixed(2)}deg)`;
    };

    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", reset);
    return () => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
    };
  }, [maxDegrees]);

  return ref;
}

/**
 * useHoverIntent — tiny helper that delays the "hover" flag, useful for
 * expanding dock navigation without flicker.
 */
export function useHoverIntent(delay = 120) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enter = useCallback(
    (callback: () => void) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(callback, delay);
    },
    [delay],
  );
  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  useEffect(() => () => clear(), [clear]);
  return { enter, clear };
}
