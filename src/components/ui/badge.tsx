import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ATTENDANCE_META,
  MEETING_STATUS_META,
  PRIORITY_META,
  PROJECT_STATUS_META,
  PROPOSAL_STATUS_META,
  TASK_STATUS_META,
} from "@/lib/utils";
import type { RoleLite } from "@/lib/types";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info" }) {
  const tones: Record<string, string> = {
    neutral: "text-muted",
    primary: "text-primary-soft border-[color-mix(in_oklab,var(--primary)_35%,transparent)] bg-[color-mix(in_oklab,var(--primary)_12%,transparent)]",
    success: "text-success border-[color-mix(in_oklab,var(--success)_35%,transparent)] bg-[color-mix(in_oklab,var(--success)_12%,transparent)]",
    warning: "text-warning border-[color-mix(in_oklab,var(--warning)_35%,transparent)] bg-[color-mix(in_oklab,var(--warning)_12%,transparent)]",
    danger: "text-danger border-[color-mix(in_oklab,var(--danger)_35%,transparent)] bg-[color-mix(in_oklab,var(--danger)_12%,transparent)]",
    info: "text-info border-[color-mix(in_oklab,var(--info)_35%,transparent)] bg-[color-mix(in_oklab,var(--info)_12%,transparent)]",
  };
  return <span className={cn("chip", tones[tone], className)} {...props} />;
}

function Dot({ color }: { color: string }) {
  return <span className="chip-dot" style={{ color }} />;
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta =
    PROJECT_STATUS_META[status] ?? TASK_STATUS_META[status] ?? PROPOSAL_STATUS_META[status] ?? MEETING_STATUS_META[status];
  if (!meta) return <Badge className={className}>{status}</Badge>;
  return (
    <span
      className={cn("chip", className)}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 10%, transparent)`,
      }}
    >
      <Dot color={meta.color} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const meta = PRIORITY_META[priority] ?? PRIORITY_META.MEDIUM;
  return (
    <span
      className={cn("chip", className)}
      style={{
        color: meta.color,
        borderColor: `color-mix(in oklab, ${meta.color} 30%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 8%, transparent)`,
      }}
    >
      {meta.label}
    </span>
  );
}

export function AttendanceBadge({ status }: { status: string }) {
  const meta = ATTENDANCE_META[status] ?? ATTENDANCE_META.ABSENT;
  return (
    <span className="chip" style={{ color: meta.color, borderColor: `color-mix(in oklab, ${meta.color} 30%, transparent)` }}>
      <Dot color={meta.color} />
      {meta.label}
    </span>
  );
}

export function RoleBadge({ role, className }: { role: RoleLite; className?: string }) {
  return (
    <span
      className={cn("chip", className)}
      style={{
        color: role.color,
        borderColor: `color-mix(in oklab, ${role.color} 34%, transparent)`,
        background: `color-mix(in oklab, ${role.color} 10%, transparent)`,
      }}
    >
      <span className="chip-dot" style={{ color: role.color }} />
      {role.name}
    </span>
  );
}

export function RarityBadge({ rarity }: { rarity: string }) {
  const map: Record<string, { label: string; color: string }> = {
    common: { label: "عادية", color: "#94A3B8" },
    rare: { label: "نادرة", color: "#22D3EE" },
    epic: { label: "ملحمية", color: "#A78BFA" },
    legendary: { label: "أسطورية", color: "#F5C451" },
  };
  const meta = map[rarity] ?? map.common;
  return (
    <span className="chip" style={{ color: meta.color, borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)` }}>
      {meta.label}
    </span>
  );
}
