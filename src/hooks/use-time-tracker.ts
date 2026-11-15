"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useTimeTracker — stopwatch persisted per task in localStorage so a refresh
 * never loses a running session. `stop()` returns the elapsed minutes which
 * the caller can persist as a TimeEntry.
 *
 * @example
 * const timer = useTimeTracker(task.id);
 * <button onClick={timer.running ? timer.stop : timer.start}>
 *   {timer.label}
 * </button>
 */
export function useTimeTracker(taskId: string) {
  const storageKey = `tectnal:timer:${taskId}`;
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<number | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const stored = JSON.parse(raw) as { startedAt: number; accumulated: number };
      const elapsed = stored.accumulated + Math.floor((Date.now() - stored.startedAt) / 1000);
      setSeconds(elapsed);
      startedAt.current = stored.startedAt;
      setRunning(true);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!running) {
      if (interval.current) clearInterval(interval.current);
      return;
    }
    interval.current = setInterval(() => {
      if (startedAt.current) {
        setSeconds((current) => current + 1);
      }
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    setRunning(true);
    localStorage.setItem(storageKey, JSON.stringify({ startedAt: Date.now(), accumulated: seconds }));
  }, [seconds, storageKey]);

  const stop = useCallback(() => {
    setRunning(false);
    localStorage.removeItem(storageKey);
    startedAt.current = null;
    return Math.max(1, Math.round(seconds / 60));
  }, [seconds, storageKey]);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(0);
    localStorage.removeItem(storageKey);
    startedAt.current = null;
  }, [storageKey]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const label = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { seconds, running, start, stop, reset, label };
}
