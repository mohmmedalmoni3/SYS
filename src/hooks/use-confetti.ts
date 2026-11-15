"use client";

import { useCallback, useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number;
}

const PALETTE = ["#7c5cff", "#22d3ee", "#ffb86b", "#34d399", "#f5c451", "#fb7185"];

/**
 * useConfetti — self-contained canvas confetti burst (no dependency).
 * Automatically disabled for reduced-motion users.
 *
 * @example
 * const { fire } = useConfetti();
 * <button onClick={() => fire()}>احتفل</button>
 */
export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef<number>(0);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frame.current);
      canvasRef.current?.remove();
      canvasRef.current = null;
    };
  }, []);

  const fire = useCallback((options: { count?: number; originX?: number; originY?: number } = {}) => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (!canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.style.cssText =
        "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9998";
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const count = options.count ?? 90;
    const originX = (options.originX ?? 0.5) * canvas.width;
    const originY = (options.originY ?? 0.45) * canvas.height;
    const scale = window.devicePixelRatio;

    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (4 + Math.random() * 9) * scale;
      particles.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4 * scale,
        size: (3 + Math.random() * 5) * scale,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }

    cancelAnimationFrame(frame.current);
    const render = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter((particle) => particle.life > 0);
      for (const particle of particles.current) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.18 * scale;
        particle.vx *= 0.992;
        particle.vy *= 0.992;
        particle.rotation += particle.spin;
        particle.life -= 0.008;
        context.save();
        context.globalAlpha = Math.max(0, particle.life);
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.6);
        context.restore();
      }
      if (particles.current.length > 0) {
        frame.current = requestAnimationFrame(render);
      } else {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    render();
  }, []);

  return { fire };
}
