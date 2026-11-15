import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <div className="relative grid size-14 place-items-center rounded-2xl border border-line bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]">
        <Icon className="size-6 text-primary-soft" />
        <span className="absolute inset-0 rounded-2xl border border-primary/20" />
      </div>
      <h3 className="font-display text-sm font-semibold">{title}</h3>
      {description ? <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function SectionHeader({
  kicker,
  title,
  description,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {kicker ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-px w-8 bg-gradient-to-l from-primary-2 to-transparent" />
            <span className="kicker">{kicker}</span>
          </div>
        ) : null}
        <h1 className="display-page text-balance">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatPill({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
}) {
  const colors: Record<string, string> = {
    primary: "var(--primary-soft)",
    success: "var(--success)",
    warning: "var(--warning)",
    danger: "var(--danger)",
    info: "var(--info)",
  };
  return (
    <span className="chip gap-2 py-1.5" style={{ color: colors[tone] }}>
      <Icon className="size-3.5" />
      <span className="text-fg/80">{label}</span>
      <span className="mono text-fg">{value}</span>
    </span>
  );
}
