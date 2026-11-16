import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  CheckSquare,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  MessageSquare,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

export const APP = {
  name: "تكتنال",
  nameEn: "TECTNAL",
  committee: "لجنة التقنية والتحول الرقمي",
  committeeEn: "Technology & Digital Transformation Committee",
  tagline: "حيث تُدار الأفكار، وتُنجَز المشاريع، ويُصنَع الأثر.",
  version: "1.1.1",
} as const;

export type NavKey =
  | "dashboard"
  | "projects"
  | "proposals"
  | "tasks"
  | "members"
  | "meetings"
  | "achievements"
  | "knowledge"
  | "files"
  | "comms"
  | "reports"
  | "settings";

export interface NavItem {
  key: NavKey;
  href: string;
  label: string;
  labelEn: string;
  icon: LucideIcon;
  permission: string;
  shortcut?: string;
  accent?: string;
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "العمل",
    items: [
      { key: "dashboard", href: "/dashboard", label: "مركز القيادة", labelEn: "Command Center", icon: LayoutDashboard, permission: "dashboard.view", shortcut: "G D" },
      { key: "projects", href: "/projects", label: "المشاريع", labelEn: "Projects", icon: FolderKanban, permission: "projects.view", shortcut: "G P" },
      { key: "proposals", href: "/proposals", label: "الاقتراحات", labelEn: "Proposals", icon: Lightbulb, permission: "proposals.view", shortcut: "G I" },
      { key: "tasks", href: "/tasks", label: "المهام", labelEn: "Tasks", icon: CheckSquare, permission: "tasks.view", shortcut: "G T" },
    ],
  },
  {
    title: "الفريق",
    items: [
      { key: "members", href: "/members", label: "الأعضاء", labelEn: "Members", icon: Users, permission: "members.view", shortcut: "G M" },
      { key: "meetings", href: "/meetings", label: "الاجتماعات", labelEn: "Meetings", icon: CalendarDays, permission: "meetings.view" },
      { key: "achievements", href: "/achievements", label: "الإنجازات", labelEn: "Achievements", icon: Trophy, permission: "achievements.view" },
    ],
  },
  {
    title: "المعرفة والنظام",
    items: [
      { key: "knowledge", href: "/knowledge", label: "مركز المعرفة", labelEn: "Knowledge", icon: FileText, permission: "knowledge.view" },
      { key: "files", href: "/files", label: "الملفات", labelEn: "Files", icon: FolderKanban, permission: "files.view" },
      { key: "comms", href: "/comms", label: "التواصل", labelEn: "Comms", icon: MessageSquare, permission: "comms.view" },
      { key: "reports", href: "/reports", label: "التقارير", labelEn: "Reports", icon: BarChart3, permission: "reports.view" },
      { key: "settings", href: "/settings", label: "الإعدادات", labelEn: "Settings", icon: Settings, permission: "settings.view" },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

export const rankIcon = ShieldCheck;
