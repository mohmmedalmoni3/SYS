import * as React from "react";
import { cn, initials } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-[0.58rem]",
  sm: "size-8 text-[0.65rem]",
  md: "size-10 text-xs",
  lg: "size-14 text-sm",
  xl: "size-20 text-lg",
  "2xl": "size-28 text-2xl",
};

export function Avatar({
  name,
  hue,
  size = "md",
  ring,
  className,
  status,
}: {
  name: string;
  hue: number;
  size?: keyof typeof SIZES;
  ring?: string;
  className?: string;
  status?: "online" | "away" | "offline";
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "relative grid place-items-center overflow-hidden rounded-full font-display font-semibold text-white",
          SIZES[size],
        )}
        style={{
          background: `linear-gradient(140deg, hsl(${hue} 88% 64%), hsl(${(hue + 50) % 360} 90% 46%))`,
          boxShadow: ring
            ? `0 0 0 2px color-mix(in oklab, ${ring} 70%, transparent), 0 0 24px -6px ${ring}`
            : `0 6px 18px -8px hsl(${hue} 90% 50% / 0.8)`,
        }}
        aria-hidden
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.55),transparent_55%)]" />
        <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">{initials(name)}</span>
      </span>
      {status ? (
        <span
          className={cn(
            "absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-[var(--bg)]",
            status === "online" && "bg-[var(--success)]",
            status === "away" && "bg-[var(--warning)]",
            status === "offline" && "bg-[var(--muted)]",
          )}
        />
      ) : null}
    </span>
  );
}

export function AvatarGroup({
  people,
  max = 5,
  size = "sm",
}: {
  people: { id: string; name: string; avatarHue: number }[];
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const visible = people.slice(0, max);
  const rest = people.length - visible.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2 space-x-reverse">
        {visible.map((person) => (
          <span key={person.id} className="rounded-full ring-2 ring-[var(--bg)]">
            <Avatar name={person.name} hue={person.avatarHue} size={size} />
          </span>
        ))}
      </div>
      {rest > 0 ? (
        <span className="ms-2 rounded-full border border-line bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] px-2 py-0.5 text-[0.65rem] text-muted">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}
