import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(value: string | Date, withYear = false): string {
  const date = toDate(value);
  return `${date.getDate()} ${AR_MONTHS[date.getMonth()]}${withYear ? ` ${date.getFullYear()}` : ""}`;
}

export function formatDateTime(value: string | Date): string {
  const date = toDate(value);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "م" : "ص";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${formatDate(date)} · ${h12}:${minutes} ${period}`;
}

export function formatTime(value: string | Date): string {
  const date = toDate(value);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "م" : "ص";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${minutes} ${period}`;
}

export function formatWeekday(value: string | Date): string {
  return AR_DAYS[toDate(value).getDay()];
}

export function relativeTime(value: string | Date): string {
  const date = toDate(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.round(hours / 24);
  if (days === 1) return "أمس";
  if (days < 7) return `قبل ${days} أيام`;
  if (days < 30) return `قبل ${Math.round(days / 7)} أسابيع`;
  if (days < 365) return `قبل ${Math.round(days / 30)} أشهر`;
  return `قبل ${Math.round(days / 365)} سنة`;
}

export function daysUntil(value: string | Date): number {
  const date = toDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function deadlineLabel(value: string | Date | null): string {
  if (!value) return "بلا موعد";
  const days = daysUntil(value);
  if (days < 0) return `متأخرة ${Math.abs(days)} يوم`;
  if (days === 0) return "اليوم";
  if (days === 1) return "غداً";
  if (days <= 7) return `بعد ${days} أيام`;
  return formatDate(value);
}

export function isOverdue(value: string | Date | null): boolean {
  if (!value) return false;
  return daysUntil(value) < 0;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(Math.round(value))} ر.س`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0)).join("");
}

export function avatarStyle(hue: number): CSSProperties {
  return {
    background: `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${(hue + 55) % 360} 90% 48%))`,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function pluralizeAr(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one;
  if (count >= 2 && count <= 10) return `${count} ${few}`;
  return `${count} ${many}`;
}

export const PRIORITY_META: Record<string, { label: string; color: string; className: string }> = {
  LOW: { label: "منخفضة", color: "#60A5FA", className: "priority-low" },
  MEDIUM: { label: "متوسطة", color: "#FBBF24", className: "priority-medium" },
  HIGH: { label: "عالية", color: "#FB923C", className: "priority-high" },
  CRITICAL: { label: "حرجة", color: "#FB7185", className: "priority-critical" },
};

export const PROJECT_STATUS_META: Record<string, { label: string; color: string }> = {
  PLANNING: { label: "تخطيط", color: "#60A5FA" },
  ACTIVE: { label: "نشط", color: "#34D399" },
  ON_HOLD: { label: "متوقف", color: "#FBBF24" },
  COMPLETED: { label: "مكتمل", color: "#A78BFA" },
  ARCHIVED: { label: "مؤرشف", color: "#94A3B8" },
};

export const TASK_STATUS_META: Record<string, { label: string; color: string }> = {
  BACKLOG: { label: "الأفكار", color: "#94A3B8" },
  TODO: { label: "قائمة الانتظار", color: "#60A5FA" },
  IN_PROGRESS: { label: "قيد التنفيذ", color: "#22D3EE" },
  REVIEW: { label: "مراجعة", color: "#A78BFA" },
  DONE: { label: "مكتمل", color: "#34D399" },
};

export const PROPOSAL_STATUS_META: Record<string, { label: string; color: string }> = {
  NEW: { label: "جديد", color: "#22D3EE" },
  UNDER_REVIEW: { label: "قيد المراجعة", color: "#FBBF24" },
  ACCEPTED: { label: "مقبول", color: "#34D399" },
  REJECTED: { label: "مرفوض", color: "#FB7185" },
  CONVERTED: { label: "تحوّل إلى مشروع", color: "#A78BFA" },
};

export const ATTENDANCE_META: Record<string, { label: string; color: string }> = {
  PRESENT: { label: "حاضر", color: "#34D399" },
  LATE: { label: "متأخر", color: "#FBBF24" },
  ABSENT: { label: "غائب", color: "#FB7185" },
  EXCUSED: { label: "بعذر", color: "#94A3B8" },
};

export const MEETING_STATUS_META: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: "مجدول", color: "#22D3EE" },
  LIVE: { label: "جارٍ الآن", color: "#FB7185" },
  COMPLETED: { label: "منتهي", color: "#94A3B8" },
  CANCELLED: { label: "ملغي", color: "#64748B" },
};
