"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundName = "click" | "success" | "hover" | "notify" | "error";

const NOTES: Record<SoundName, { frequency: number; duration: number; type: OscillatorType }> = {
  click: { frequency: 520, duration: 0.045, type: "triangle" },
  success: { frequency: 720, duration: 0.12, type: "sine" },
  hover: { frequency: 340, duration: 0.03, type: "sine" },
  notify: { frequency: 880, duration: 0.1, type: "sine" },
  error: { frequency: 180, duration: 0.14, type: "sawtooth" },
};

/**
 * useSoundFx — optional, very subtle UI sounds generated with the Web Audio
 * API (no audio files). Muted by default and remembered per browser.
 *
 * @example
 * const { play, enabled, toggle } = useSoundFx();
 * <button onClick={() => { play("click"); createTask(); }}>إضافة</button>
 */
export function useSoundFx() {
  const [enabled, setEnabled] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setEnabled(localStorage.getItem("tectnal:sound") === "on");
  }, []);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      localStorage.setItem("tectnal:sound", current ? "off" : "on");
      return !current;
    });
  }, []);

  const play = useCallback(
    (name: SoundName = "click") => {
      if (!enabled) return;
      try {
        if (!contextRef.current) {
          const AudioContextClass =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          contextRef.current = new AudioContextClass();
        }
        const context = contextRef.current;
        if (context.state === "suspended") void context.resume();
        const note = NOTES[name];
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = note.type;
        oscillator.frequency.value = note.frequency;
        gain.gain.setValueAtTime(0.035, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + note.duration);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + note.duration);
      } catch {
        /* audio unsupported */
      }
    },
    [enabled],
  );

  return { play, enabled, toggle };
}
