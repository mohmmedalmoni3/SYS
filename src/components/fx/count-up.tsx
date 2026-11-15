"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useCountUp } from "@/hooks/use-motion";
import { cn, formatNumber } from "@/lib/utils";

/** Animated numeric counter with tabular figures. */
export function CountUp({
  value,
  className,
  suffix,
  prefix,
  decimals = 0,
  duration = 1400,
  animateOnView = true,
}: {
  value: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  animateOnView?: boolean;
}) {
  const [visible, setVisible] = React.useState(!animateOnView);
  const ref = React.useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    if (!animateOnView) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [animateOnView]);

  const animated = useCountUp(Math.round(value), { duration, enabled: visible });
  const rendered =
    decimals > 0 ? (animated / 10 ** decimals).toFixed(decimals) : formatNumber(animated);

  return (
    <span ref={ref} className={cn("num tabular-nums", className)}>
      {prefix}
      {rendered}
      {suffix}
    </span>
  );
}

/** Small inline delta indicator. */
export function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
        positive ? "bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-success" : "bg-[color-mix(in_oklab,var(--danger)_14%,transparent)] text-danger",
      )}
    >
      <span className="num">{positive ? "+" : ""}{value}{suffix}</span>
    </motion.span>
  );
}
