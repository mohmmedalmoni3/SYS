"use client";

import { useEffect, useRef, useState } from "react";

interface RealtimeOptions {
  /** Polling interval in ms. Swap for a Pusher channel in production. */
  intervalMs?: number;
  enabled?: boolean;
}

/**
 * useRealtime — lightweight live subscription used by notifications and the
 * activity feed. It polls only while the tab is visible and immediately on
 * focus, and is designed to be swapped for Pusher/Socket.io without touching
 * consumers.
 *
 * @example
 * const { isLive, refresh } = useRealtime(() => mutate("/api/notifications"), { intervalMs: 20000 });
 */
export function useRealtime(onTick: () => void, { intervalMs = 20_000, enabled = true }: RealtimeOptions = {}) {
  const callback = useRef(onTick);
  callback.current = onTick;
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (document.visibilityState === "hidden") return;
      callback.current();
      setLastUpdated(Date.now());
    };

    const start = () => {
      if (timer) return;
      setIsLive(true);
      tick();
      timer = setInterval(tick, intervalMs);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
      setIsLive(false);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", tick);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", tick);
    };
  }, [enabled, intervalMs]);

  return { isLive, lastUpdated };
}
