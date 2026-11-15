"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Glass surface with a calm static finish.
 * Used across the dashboard and project cards.
 */
export function SpotlightCard({
  className,
  children,
  tilt = false,
  tiltDegrees = 5,
  as: Tag = "div",
}: {
  className?: string;
  children: React.ReactNode;
  tilt?: boolean;
  tiltDegrees?: number;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag className={cn("glass rounded-[var(--radius)]", className)}>
      {children}
    </Tag>
  );
}
