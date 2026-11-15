"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { APP } from "@/lib/navigation";

/**
 * Cinematic first-load preloader — runs once per browser session and is
 * skipped entirely for reduced-motion users.
 */
export function Preloader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem("tectnal:preloaded") === "1") return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("tectnal:preloaded", "1");
    }, 1900);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[10000] grid place-items-center bg-[var(--bg)]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="aurora aurora-1 opacity-40" />
            <div className="aurora aurora-2 opacity-25" />
            <div className="app-bg absolute inset-0" />
          </div>

          <div className="relative flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid size-24 place-items-center"
            >
              <span className="absolute inset-0 rounded-[2rem] border border-primary/40" />
              <span className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/30 via-transparent to-primary-2/20 blur-xl" />
              <span className="absolute -inset-4 animate-spin-slow rounded-full border border-dashed border-primary-2/25" />
              <span className="font-display text-4xl font-bold text-gradient">ت</span>
            </motion.div>

            <div className="text-center">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.6 }}
                className="font-display text-2xl font-bold tracking-[0.4em] text-fg"
              >
                TECTNAL
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-2 text-[0.7rem] tracking-[0.2em] text-muted"
              >
                {APP.committee}
              </motion.p>
            </div>

            <div className="h-px w-56 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-l from-primary to-primary-2"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="kicker text-[0.6rem]"
            >
              INITIALIZING WORKSPACE
            </motion.span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
