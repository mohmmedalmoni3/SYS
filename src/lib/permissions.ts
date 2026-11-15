/**
 * TECTNAL — Permission catalog
 * Permission keys are granular (page / action / field level) and are the
 * single source of truth shared by the database seed, the server guards and
 * the UI (`usePermission`, `<Can />`, `<PermissionGate />`).
 */

export const PERMISSION_GROUPS = [
  { key: "dashboard", label: "لوحة القيادة", labelEn: "Dashboard" },
  { key: "projects", label: "المشاريع", labelEn: "Projects" },
  { key: "proposals", label: "الاقتراحات", labelEn: "Proposals" },
  { key: "tasks", label: "المهام", labelEn: "Tasks" },
  { key: "members", label: "الأعضاء", labelEn: "Members" },
  { key: "meetings", label: "الاجتماعات", labelEn: "Meetings" },
  { key: "achievements", label: "الإنجازات", labelEn: "Achievements" },
  { key: "knowledge", label: "مركز المعرفة", labelEn: "Knowledge" },
  { key: "files", label: "الملفات", labelEn: "Files" },
  { key: "comms", label: "التواصل", labelEn: "Comms" },
  { key: "reports", label: "التقارير", labelEn: "Reports" },
  { key: "settings", label: "الإعدادات", labelEn: "Settings" },
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number]["key"];

export interface PermissionDef {
  key: string;
  label: string;
  labelEn: string;
  group: PermissionGroup;
  description?: string;
}

export const PERMISSIONS: PermissionDef[] = [
  { key: "dashboard.view", label: "عرض لوحة القيادة", labelEn: "View dashboard", group: "dashboard" },

  { key: "projects.view", label: "عرض المشاريع", labelEn: "View projects", group: "projects" },
  { key: "projects.create", label: "إنشاء مشروع", labelEn: "Create project", group: "projects" },
  { key: "projects.edit", label: "تعديل المشاريع", labelEn: "Edit projects", group: "projects" },
  { key: "projects.delete", label: "حذف المشاريع", labelEn: "Delete projects", group: "projects" },
  { key: "projects.archive", label: "أرشفة المشاريع", labelEn: "Archive projects", group: "projects" },
  { key: "projects.budget", label: "رؤية الميزانية", labelEn: "See budgets", group: "projects" },

  { key: "proposals.view", label: "عرض الاقتراحات", labelEn: "View proposals", group: "proposals" },
  { key: "proposals.create", label: "تقديم اقتراح", labelEn: "Submit proposal", group: "proposals" },
  { key: "proposals.vote", label: "التصويت على الاقتراحات", labelEn: "Vote on proposals", group: "proposals" },
  { key: "proposals.review", label: "مراجعة الاقتراحات", labelEn: "Review proposals", group: "proposals" },
  { key: "proposals.convert", label: "تحويل اقتراح إلى مشروع", labelEn: "Convert proposal", group: "proposals" },
  { key: "proposals.delete", label: "حذف الاقتراحات", labelEn: "Delete proposals", group: "proposals" },

  { key: "tasks.view", label: "عرض المهام", labelEn: "View tasks", group: "tasks" },
  { key: "tasks.create", label: "إنشاء مهمة", labelEn: "Create task", group: "tasks" },
  { key: "tasks.edit", label: "تعديل المهام", labelEn: "Edit tasks", group: "tasks" },
  { key: "tasks.assign", label: "إسناد المهام", labelEn: "Assign tasks", group: "tasks" },
  { key: "tasks.delete", label: "حذف المهام", labelEn: "Delete tasks", group: "tasks" },

  { key: "members.view", label: "عرض الأعضاء", labelEn: "View members", group: "members" },
  { key: "members.invite", label: "دعوة أعضاء", labelEn: "Invite members", group: "members" },
  { key: "members.edit", label: "تعديل ملفات الأعضاء", labelEn: "Edit members", group: "members" },
  { key: "members.remove", label: "إزالة الأعضاء", labelEn: "Remove members", group: "members" },
  { key: "members.rank.edit", label: "تعديل الرتب والصلاحيات", labelEn: "Manage ranks", group: "members" },

  { key: "meetings.view", label: "عرض الاجتماعات", labelEn: "View meetings", group: "meetings" },
  { key: "meetings.create", label: "جدولة الاجتماعات", labelEn: "Schedule meetings", group: "meetings" },
  { key: "meetings.minutes", label: "تحرير المحاضر", labelEn: "Edit minutes", group: "meetings" },
  { key: "meetings.attendance", label: "تسجيل الحضور", labelEn: "Record attendance", group: "meetings" },

  { key: "achievements.view", label: "عرض الإنجازات", labelEn: "View achievements", group: "achievements" },
  { key: "achievements.award", label: "منح الإنجازات", labelEn: "Award achievements", group: "achievements" },

  { key: "knowledge.view", label: "عرض مركز المعرفة", labelEn: "View knowledge", group: "knowledge" },
  { key: "knowledge.create", label: "إضافة مقال", labelEn: "Create article", group: "knowledge" },
  { key: "knowledge.edit", label: "تعديل المقالات", labelEn: "Edit articles", group: "knowledge" },
  { key: "knowledge.delete", label: "حذف المقالات", labelEn: "Delete articles", group: "knowledge" },

  { key: "files.view", label: "عرض الملفات", labelEn: "View files", group: "files" },
  { key: "files.upload", label: "رفع الملفات", labelEn: "Upload files", group: "files" },
  { key: "files.delete", label: "حذف الملفات", labelEn: "Delete files", group: "files" },
  { key: "files.manage", label: "إدارة المجلدات والصلاحيات", labelEn: "Manage folders", group: "files" },

  { key: "comms.view", label: "عرض قنوات التواصل", labelEn: "View channels", group: "comms" },
  { key: "comms.announce", label: "نشر الإعلانات", labelEn: "Publish announcements", group: "comms" },
  { key: "comms.moderate", label: "إدارة القنوات", labelEn: "Moderate channels", group: "comms" },

  { key: "reports.view", label: "عرض التقارير", labelEn: "View reports", group: "reports" },
  { key: "reports.export", label: "تصدير التقارير", labelEn: "Export reports", group: "reports" },

  { key: "settings.view", label: "عرض الإعدادات", labelEn: "View settings", group: "settings" },
  { key: "settings.edit", label: "تعديل الإعدادات", labelEn: "Edit settings", group: "settings" },
  { key: "audit.view", label: "عرض سجل التدقيق", labelEn: "View audit log", group: "settings" },
  { key: "system.danger", label: "صلاحيات النظام الحساسة", labelEn: "System danger zone", group: "settings" },
];

export const ALL_PERMISSIONS = PERMISSIONS.map((permission) => permission.key);

export type PermissionKey = (typeof PERMISSIONS)[number]["key"] | string;

const ALWAYS_ALLOWED = new Set(["dashboard.view"]);

export function hasPermission(
  permissions: readonly string[] | undefined | null,
  permission: PermissionKey,
): boolean {
  if (!permissions) return false;
  if (ALWAYS_ALLOWED.has(permission)) return true;
  return permissions.includes("system.danger") || permissions.includes(permission);
}

export function hasAnyPermission(
  permissions: readonly string[] | undefined | null,
  required: readonly string[],
): boolean {
  if (!permissions) return false;
  if (required.length === 0) return true;
  return required.some((permission) => hasPermission(permissions, permission));
}

export function permissionLabel(key: string): string {
  return PERMISSIONS.find((permission) => permission.key === key)?.label ?? key;
}
