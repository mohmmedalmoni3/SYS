"use client";

import * as React from "react";
import { useMagnetic } from "@/hooks/use-interaction";
import { cn } from "@/lib/utils";

/** Wraps any content in a magnetic hover zone (desktop only). */
export function Magnetic({
  children,
  strength = 0.22,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useMagnetic<HTMLSpanElement>(strength);
  return (
    <span ref={ref} className={cn("inline-flex will-change-transform", className)}>
      {children}
    </span>
  );
}
