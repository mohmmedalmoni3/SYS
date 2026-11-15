"use client";

import { useEffect, useRef } from "react";

/** Desktop-only custom cursor: a precise dot plus a lagging glow ring. */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let frame = 0;

    const move = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.opacity = "1";
      ring.style.opacity = "1";
      dot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;
      const target = event.target as HTMLElement;
      const interactive = Boolean(target.closest("a, button, [role='button'], input, textarea, select, [data-cursor='hover']"));
      ring.dataset.hover = String(interactive);
    };

    const render = () => {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;
      ring.style.transform = `translate3d(${ringX - 17}px, ${ringY - 17}px, 0)`;
      frame = requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="hidden md:block" aria-hidden>
      <div ref={dotRef} className="cursor-dot opacity-0" />
      <div ref={ringRef} className="cursor-ring opacity-0" />
    </div>
  );
}
