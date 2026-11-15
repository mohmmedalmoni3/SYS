"use client";

import { useEffect, useRef } from "react";

type Binding = (event: KeyboardEvent) => void;
type Bindings = Record<string, Binding>;

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function comboOf(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("mod");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  parts.push(event.key.toLowerCase());
  return parts.join("+");
}

/**
 * useHotkeys — declarative keyboard shortcuts with modifier support and
 * two-key sequences (`g` then `d`). Ignores keystrokes inside inputs.
 *
 * @example
 * useHotkeys({
 *   "mod+k": () => palette.toggle(),
 *   "mod+shift+p": () => router.push("/projects"),
 *   "g d": () => router.push("/dashboard"),
 * });
 */
export function useHotkeys(bindings: Bindings, options: { enabled?: boolean } = {}) {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const enabled = options.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;
    let prefix = "";
    let prefixTimer: ReturnType<typeof setTimeout> | null = null;

    const handler = (event: KeyboardEvent) => {
      if (isEditable(event.target)) return;
      const combo = comboOf(event);
      const sequences = Object.keys(bindingsRef.current).filter((key) => key.includes(" "));
      const direct = bindingsRef.current[combo];

      if (direct) {
        event.preventDefault();
        prefix = "";
        direct(event);
        return;
      }

      const key = event.key.toLowerCase();
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        for (const sequence of sequences) {
          const [first, second] = sequence.split(" ");
          if (prefix === first && key === second) {
            event.preventDefault();
            bindingsRef.current[sequence](event);
            prefix = "";
            if (prefixTimer) clearTimeout(prefixTimer);
            return;
          }
        }
        if (sequences.some((sequence) => sequence.startsWith(`${key} `))) {
          prefix = key;
          if (prefixTimer) clearTimeout(prefixTimer);
          prefixTimer = setTimeout(() => {
            prefix = "";
          }, 1200);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (prefixTimer) clearTimeout(prefixTimer);
    };
  }, [enabled]);
}
