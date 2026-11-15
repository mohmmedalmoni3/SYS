import {
  Blocks,
  Crown,
  Eye,
  Flag,
  Layers,
  ShieldCheck,
  Sprout,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

const ROLE_ICONS: Record<string, LucideIcon> = {
  crown: Crown,
  "shield-check": ShieldCheck,
  layers: Layers,
  flag: Flag,
  "user-check": UserCheck,
  sprout: Sprout,
  eye: Eye,
  blocks: Blocks,
};

export function RoleIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ROLE_ICONS[icon] ?? ShieldCheck;
  return <Icon className={className} />;
}

const BADGE_ICONS: Record<string, LucideIcon> = {
  footprints: Sprout,
  hammer: Blocks,
  blocks: Layers,
  "graduation-cap": UserCheck,
  shield: ShieldCheck,
  lightbulb: Crown,
  flame: Flag,
  crown: Crown,
};

export function BadgeIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = BADGE_ICONS[icon] ?? ShieldCheck;
  return <Icon className={className} />;
}
