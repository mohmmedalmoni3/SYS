import type { Subtask, Task, TaskDependency, TimeEntry } from "./types";

const at = (days: number, hour = 18) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};
const created = (days: number) => at(-days, 10);

const task = (
  id: string,
  title: string,
  projectId: string | null,
  assigneeId: string | null,
  status: Task["status"],
  priority: Task["priority"],
  dueIn: number | null,
  estimate: number | null,
  labels: string[],
  description: string,
  order: number,
  extra: Partial<Task> = {},
): Task => ({
  id,
  title,
  description,
  status,
  priority,
  projectId,
  assigneeId,
  createdById: "u_reem",
  meetingId: null,
  dueDate: dueIn === null ? null : at(dueIn),
  estimate,
  order,
  labels,
  recurrence: "none",
  completedAt: status === "DONE" ? created(2) : null,
  createdAt: created(14),
  ...extra,
});

export const tasks: Task[] = [
  // ── IN PROGRESS ──────────────────────────────────────────────
  task("t_001", "بناء مكوّنات نظام التصميم (Buttons / Cards / Inputs)", "p_atlas", "u_abdullah", "IN_PROGRESS", "HIGH", 1, 480, ["واجهات", "Design System"], "تحويل رموز التصميم إلى مكوّنات React مع دعم RTL والثيمين.", 1),
  task("t_002", "صفحة الرتب والصلاحيات — مصفوفة الصلاحيات", "p_atlas", "u_reem", "IN_PROGRESS", "CRITICAL", 0, 600, ["RBAC", "واجهات"], "مصفوفة تفاعلية لتعديل صلاحيات كل رتبة مع حفظ فوري وسجل تدقيق.", 2),
  task("t_003", "ربط الدخول عبر Discord OAuth", "p_gateway", "u_mohammed", "IN_PROGRESS", "HIGH", 3, 360, ["Auth", "تكامل"], "إضافة مزوّد Discord مع مزامنة الاسم والصورة.", 3),
  task("t_004", "فهرسة محاضر الاجتماعات في قاعدة المعرفة", "p_ai", "u_hind", "IN_PROGRESS", "MEDIUM", 6, 420, ["AI", "بيانات"], "تنظيف المحاضر وتقسيمها إلى مقاطع قابلة للبحث.", 4),
  task("t_005", "تدقيق صلاحيات لوحة الإعدادات", "p_security", "u_dana", "IN_PROGRESS", "CRITICAL", -1, 240, ["أمن", "مراجعة"], "التأكد من أن كل إجراء إداري محمي بفحص على الخادم.", 5),
  task("t_006", "تصميم شاشة الهبوط للعضو الجديد", "p_onboarding", "u_lama", "IN_PROGRESS", "LOW", 2, 300, ["تصميم"], "شاشة ترحيب تعريفية مع خطوات التهيئة.", 6),
  task("t_007", "محرر المقالات Tiptap — دعم العربية", "p_knowledge", "u_abdullah", "IN_PROGRESS", "MEDIUM", 4, 480, ["محتوى", "محرر"], "ضبط اتجاه النص والاقتباسات والقوائم داخل المحرر.", 7),
  task("t_008", "لوحة القيادة — بطاقات Bento", "p_atlas", "u_lama", "IN_PROGRESS", "HIGH", 0, 540, ["واجهات", "Bento"], "تخطيط Bento غير متماثل مع Spotlight وTilt.", 8),

  // ── TODO ─────────────────────────────────────────────────────
  task("t_009", "إشعارات لحظية عند تغيير حالة المهمة", "p_atlas", "u_mohammed", "TODO", "HIGH", 5, 360, ["Realtime"], "بث الحدث إلى المسؤول وقائد المشروع.", 1),
  task("t_010", "توليد تقرير أداء شهري PDF", "p_data", "u_hind", "TODO", "MEDIUM", 9, 420, ["تقارير"], "قالب تقرير عربي قابل للطباعة مع الرسوم.", 2),
  task("t_011", "اختبار اختراق داخلي لمسارات API", "p_security", "u_dana", "TODO", "CRITICAL", 12, 600, ["أمن"], "تغطية المصادقة والصلاحيات وتسريب البيانات.", 3),
  task("t_012", "إضافة التبعيات بين المهام في Kanban", "p_atlas", "u_reem", "TODO", "MEDIUM", 7, 300, ["مهام"], "منع نقل مهمة إلى التنفيذ قبل إنهاء المهام السابقة.", 4),
  task("t_013", "كتابة دليل استخدام نظام الرتب", "p_knowledge", "u_jawaher", "TODO", "LOW", 10, 180, ["توثيق"], "دليل مصوّر لرؤساء الأقسام.", 5),
  task("t_014", "تحسين أداء صفحة المشاريع (LCP)", "p_atlas", "u_abdullah", "TODO", "HIGH", 3, 240, ["أداء"], "خفض حجم الحزمة وتحسين تحميل الرسوم.", 6),
  task("t_015", "تهيئة حساب العضو الجديد تلقائياً", "p_onboarding", "u_mohammed", "TODO", "MEDIUM", 8, 300, ["أتمتة"], "إنشاء الملف الشخصي ومسارات التعلّم عند القبول.", 7),
  task("t_016", "مراجعة نصوص الواجهة العربية", "p_atlas", "u_noura", "TODO", "MEDIUM", 2, 120, ["محتوى"], "توحيد المصطلحات وصياغة الأزرار.", 8),
  task("t_017", "تصدير بيانات الأعضاء Excel", "p_data", "u_saad", "TODO", "LOW", 14, 180, ["تقارير"], "دعم العربية واتجاه الأعمدة.", 9),
  task("t_018", "ربط الإشعارات بالبريد الإلكتروني", "p_gateway", "u_turki", "TODO", "MEDIUM", 11, 240, ["تكامل"], "ملخص يومي اختياري للأعضاء.", 10),

  // ── REVIEW ───────────────────────────────────────────────────
  task("t_019", "مراجعة كود نظام الصلاحيات", "p_atlas", "u_khalid", "REVIEW", "HIGH", 1, 180, ["مراجعة", "RBAC"], "تدقيق الفحوصات على الخادم واختبارات الحالات الحدّية.", 1),
  task("t_020", "اعتماد هوية شاشة تسجيل الدخول", "p_atlas", "u_lama", "REVIEW", "MEDIUM", 2, 120, ["تصميم"], "نسخة نهائية مع الحركات الدقيقة.", 2),
  task("t_021", "مراجعة سياسة الاحتفاظ بالبيانات", "p_security", "u_mona", "REVIEW", "HIGH", 4, 240, ["حوكمة"], "مطابقة سياسة الاحتفاظ مع متطلبات الامتثال.", 3),
  task("t_022", "اختبار تجربة المحادثة مع 5 أعضاء", "p_ai", "u_noura", "REVIEW", "MEDIUM", 3, 180, ["UX", "AI"], "جلسات اختبار وجمع ملاحظات.", 4),
  task("t_023", "مراجعة محتوى مسار التهيئة", "p_onboarding", "u_jawaher", "REVIEW", "LOW", 5, 120, ["محتوى"], "تدقيق لغوي وتقني للمسارات الخمسة.", 5),

  // ── BACKLOG ──────────────────────────────────────────────────
  task("t_024", "تكامل التقويم مع Google Calendar", "p_atlas", null, "BACKLOG", "LOW", 30, 360, ["تكامل"], "مزامنة الاجتماعات والمواعيد النهائية.", 1),
  task("t_025", "وضع عدم الاتصال (Offline) للمهام", "p_atlas", null, "BACKLOG", "LOW", null, 600, ["PWA"], "تخزين مؤقت للمهام وتزامن لاحق.", 2),
  task("t_026", "لوحة صدارة سنوية مع جوائز", "p_atlas", null, "BACKLOG", "MEDIUM", 21, 300, ["Gamification"], "تصميم جوائز نهاية العام.", 3),
  task("t_027", "دعم اللغة الإنجليزية الكامل", "p_atlas", null, "BACKLOG", "MEDIUM", 40, 720, ["i18n"], "ترجمة كل الواجهات والتبديل الفوري.", 4),
  task("t_028", "تكامل Pusher للإشعارات اللحظية", "p_atlas", null, "BACKLOG", "LOW", null, 240, ["Realtime"], "استبدال الاستطلاع بقنوات Push.", 5),

  // ── DONE ─────────────────────────────────────────────────────
  task("t_029", "تثبيت الخطوط العربية وFluid Typography", "p_atlas", "u_abdullah", "DONE", "HIGH", -12, 180, ["واجهات"], "Alexandria + IBM Plex Sans Arabic + أرقام أحادية.", 1),
  task("t_030", "بناء نظام الرتب والصلاحيات في قاعدة البيانات", "p_atlas", "u_khalid", "DONE", "CRITICAL", -9, 480, ["RBAC", "DB"], "جداول الرتب والصلاحيات وعلاقاتها.", 2),
  task("t_031", "تصميم شاشة Preloader سينمائية", "p_atlas", "u_lama", "DONE", "MEDIUM", -7, 240, ["تصميم"], "شعار تكتنال مع حركة ضوئية.", 3),
  task("t_032", "إعداد Auth.js مع Credentials", "p_gateway", "u_mohammed", "DONE", "HIGH", -6, 300, ["Auth"], "تسجيل دخول بالبريد وكلمة المرور مع bcrypt.", 4),
  task("t_033", "تجهيز بيئة النشر على Vercel", "p_gateway", "u_turki", "DONE", "MEDIUM", -5, 180, ["DevOps"], "متغيرات البيئة وربط Neon.", 5),
  task("t_034", "تحليل نتائج استبيان الأعضاء", "p_data", "u_hind", "DONE", "MEDIUM", -4, 240, ["بيانات"], "تلخيص 48 استجابة في تقرير.", 6),
  task("t_035", "كتابة 8 مقالات في مركز المعرفة", "p_knowledge", "u_jawaher", "DONE", "MEDIUM", -3, 600, ["محتوى"], "أدلة عملية مع أمثلة.", 7),
  task("t_036", "تحديد مؤشرات الأداء الاثني عشر", "p_data", "u_noura", "DONE", "HIGH", -11, 300, ["KPI"], "اعتماد المؤشرات مع أصحابها.", 8),
  task("t_037", "أرشفة وثائق 2024", "p_archive", "u_jawaher", "DONE", "LOW", -40, 480, ["أرشيف"], "رقمنة 1,240 وثيقة.", 9),
  task("t_038", "تسجيل قرارات الاجتماع التأسيسي", "p_atlas", "u_ahmed", "DONE", "HIGH", -15, 120, ["محاضر"], "توثيق القرارات والمهام المترتبة.", 10),
  task("t_039", "إعداد سجل التدقيق Audit Log", "p_atlas", "u_dana", "DONE", "HIGH", -8, 300, ["أمن"], "تسجيل كل عملية حساسة مع الفاعل والوقت.", 11),
  task("t_040", "تصميم شارات الإنجاز", "p_atlas", "u_lama", "DONE", "LOW", -2, 240, ["Gamification", "تصميم"], "12 شارة بأربع درجات ندرة.", 12),
];

export const subtasks: Subtask[] = [
  { id: "s_01", taskId: "t_001", title: "زر أساسي بحالات hover/focus/loading", done: true, order: 1 },
  { id: "s_02", taskId: "t_001", title: "بطاقة Glass مع حد متدرج", done: true, order: 2 },
  { id: "s_03", taskId: "t_001", title: "حقول إدخال مع رسائل خطأ", done: false, order: 3 },
  { id: "s_04", taskId: "t_001", title: "توثيق المكوّنات في Storybook", done: false, order: 4 },
  { id: "s_05", taskId: "t_002", title: "جدول الرتب مع الألوان", done: true, order: 1 },
  { id: "s_06", taskId: "t_002", title: "مصفوفة صلاحيات قابلة للتبديل", done: true, order: 2 },
  { id: "s_07", taskId: "t_002", title: "حفظ فوري مع Optimistic UI", done: false, order: 3 },
  { id: "s_08", taskId: "t_002", title: "سجل تدقيق لكل تغيير", done: false, order: 4 },
  { id: "s_09", taskId: "t_003", title: "إنشاء تطبيق Discord وربط المفاتيح", done: true, order: 1 },
  { id: "s_10", taskId: "t_003", title: "مزامنة الاسم والصورة", done: false, order: 2 },
  { id: "s_11", taskId: "t_003", title: "معالجة حالة البريد المكرر", done: false, order: 3 },
  { id: "s_12", taskId: "t_007", title: "دعم الاتجاه RTL داخل المحرر", done: true, order: 1 },
  { id: "s_13", taskId: "t_007", title: "رفع الصور داخل المقال", done: false, order: 2 },
  { id: "s_14", taskId: "t_007", title: "حفظ تلقائي للمسودة", done: false, order: 3 },
  { id: "s_15", taskId: "t_005", title: "حصر كل Server Actions الحساسة", done: true, order: 1 },
  { id: "s_16", taskId: "t_005", title: "اختبار تصعيد الصلاحيات", done: false, order: 2 },
  { id: "s_17", taskId: "t_008", title: "تخطيط Bento متجاوب", done: true, order: 1 },
  { id: "s_18", taskId: "t_008", title: "تأثير Spotlight على البطاقات", done: false, order: 2 },
  { id: "s_19", taskId: "t_008", title: "سحب وإفلات الودجات", done: false, order: 3 },
  { id: "s_20", taskId: "t_009", title: "قناة أحداث المهام", done: false, order: 1 },
  { id: "s_21", taskId: "t_009", title: "Toast + عداد غير مقروء", done: false, order: 2 },
];

export const taskDependencies: TaskDependency[] = [
  { id: "dep_1", taskId: "t_012", dependsOnId: "t_001" },
  { id: "dep_2", taskId: "t_009", dependsOnId: "t_002" },
  { id: "dep_3", taskId: "t_010", dependsOnId: "t_036" },
  { id: "dep_4", taskId: "t_007", dependsOnId: "t_001" },
];

export const timeEntries: TimeEntry[] = [
  { id: "te_1", taskId: "t_001", userId: "u_abdullah", minutes: 95, note: "بناء حالات الأزرار", startedAt: at(-2, 10), endedAt: at(-2, 11) },
  { id: "te_2", taskId: "t_001", userId: "u_abdullah", minutes: 70, note: "ضبط الحدود المتدرجة", startedAt: at(-1, 9), endedAt: at(-1, 10) },
  { id: "te_3", taskId: "t_002", userId: "u_reem", minutes: 120, note: "مصفوفة الصلاحيات", startedAt: at(-1, 13), endedAt: at(-1, 15) },
  { id: "te_4", taskId: "t_002", userId: "u_reem", minutes: 45, note: "مراجعة مع دانة", startedAt: at(0, 9), endedAt: at(0, 10) },
  { id: "te_5", taskId: "t_005", userId: "u_dana", minutes: 60, note: "جرد Server Actions", startedAt: at(0, 11), endedAt: at(0, 12) },
  { id: "te_6", taskId: "t_003", userId: "u_mohammed", minutes: 150, note: "إعداد مزوّد Discord", startedAt: at(-2, 14), endedAt: at(-2, 16) },
  { id: "te_7", taskId: "t_008", userId: "u_lama", minutes: 110, note: "تخطيط Bento", startedAt: at(-1, 10), endedAt: at(-1, 12) },
  { id: "te_8", taskId: "t_019", userId: "u_khalid", minutes: 40, note: "مراجعة أولية", startedAt: at(0, 8), endedAt: at(0, 9) },
];
