import type {
  Announcement,
  AuditLog,
  Channel,
  Invitation,
  Message,
  Notification,
} from "./types";

const at = (days: number, hour = 13, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const channels: Channel[] = [
  {
    id: "ch_general",
    name: "general",
    description: "النقاش العام وأخبار اللجنة اليومية.",
    icon: "hash",
    isPrivate: false,
    memberIds: ["u_ahmed", "u_noura", "u_khalid", "u_reem", "u_abdullah", "u_lama", "u_mohammed", "u_hind", "u_faisal", "u_dana", "u_turki", "u_jawaher", "u_saad", "u_mona"],
  },
  {
    id: "ch_engineering",
    name: "engineering",
    description: "قرارات تقنية، مراجعات كود، ومعوقات التطوير.",
    icon: "terminal",
    isPrivate: false,
    memberIds: ["u_khalid", "u_reem", "u_abdullah", "u_mohammed", "u_turki", "u_faisal", "u_dana"],
  },
  {
    id: "ch_design",
    name: "design",
    description: "مراجعات التصميم وتجربة المستخدم.",
    icon: "palette",
    isPrivate: false,
    memberIds: ["u_lama", "u_noura", "u_reem", "u_abdullah", "u_jawaher"],
  },
  {
    id: "ch_leads",
    name: "leads",
    description: "قادة المشاريع والقيادة فقط.",
    icon: "lock",
    isPrivate: true,
    memberIds: ["u_ahmed", "u_noura", "u_khalid", "u_reem", "u_turki", "u_dana"],
  },
];

const message = (id: string, channelId: string, authorId: string, body: string, days: number, hour: number, minute: number): Message => ({
  id,
  channelId,
  authorId,
  body,
  createdAt: at(days, hour, minute),
});

export const messages: Message[] = [
  message("msg_01", "ch_general", "u_ahmed", "صباح الخير جميعاً ☀️\nتذكير: الاجتماع الأسبوعي غداً 7:30 مساءً. جدول الأعمال منشور في قسم الاجتماعات.", 0, 9, 15),
  message("msg_02", "ch_general", "u_noura", "أضفت بند الاقتراحات المرشحة للتحويل — أفضل 3 بالنقاط. من عنده اعتراض؟", 0, 9, 32),
  message("msg_03", "ch_general", "u_reem", "لا اعتراض. سأعرض المرحلة الثالثة مباشرة من البيئة التجريبية.", 0, 9, 40),
  message("msg_04", "ch_general", "u_faisal", "أول مهمة لي اكتملت أمس 🎉 شكراً لمحمد على المراجعة.", 0, 10, 5),
  message("msg_05", "ch_general", "u_mohammed", "أحسنت فيصل! المراجعة كانت نظيفة والأسماء واضحة.", 0, 10, 12),
  message("msg_06", "ch_general", "u_jawaher", "أنشر مقال «أول 30 يوماً» اليوم. أي ملاحظات أخيرة؟", 0, 11, 2),
  message("msg_07", "ch_engineering", "u_khalid", "مراجعة كود الصلاحيات: وجدت نقطتين — تحديث الجلسة بعد تغيير الرتبة، وفحص الخادم في إجراء أرشفة المشروع.", 1, 14, 20),
  message("msg_08", "ch_engineering", "u_reem", "سأصلح الاثنتين اليوم وأضيف اختبارات. @دانة ممكن مراجعة الفحص الأمني بعد الدمج؟", 1, 14, 35),
  message("msg_09", "ch_engineering", "u_dana", "أكيد، سأراجع خلال ساعة من إشعار الدمج.", 1, 14, 42),
  message("msg_10", "ch_engineering", "u_turki", "بيئة الاختبار لـ Discord جاهزة، الدخول يعمل. المتبقي معالجة البريد المكرر.", 1, 16, 10),
  message("msg_11", "ch_engineering", "u_abdullah", "محرر Tiptap يدعم العربية الآن، لكن الاقتباسات تحتاج ضبط padding في RTL.", 0, 11, 25),
  message("msg_12", "ch_design", "u_lama", "رفعت نسخة الجوال من الـ Kanban: أعمدة أفقية + مؤشر سحب واضح.", 2, 12, 5),
  message("msg_13", "ch_design", "u_noura", "جميل جداً. أضيفي حالة الفراغ «لا مهام هنا» مع رسم صغير.", 2, 12, 30),
  message("msg_14", "ch_design", "u_lama", "تم. الشاشة جاهزة للمراجعة يوم الأربعاء.", 2, 12, 45),
  message("msg_15", "ch_leads", "u_noura", "طلبت ميزانية إضافية للمراجعة الأمنية. القرار خلال اجتماع التخطيط.", 3, 10, 0),
  message("msg_16", "ch_leads", "u_dana", "أحتاج اعتماداً على سياسة الاحتفاظ قبل استكمال الاختبار.", 3, 10, 15),
  message("msg_17", "ch_leads", "u_ahmed", "أعتمد المسودة، وسنضيف مراجعة ربع سنوية. دانة، أكملي الاختبار.", 3, 10, 22),
];

export const announcements: Announcement[] = [
  {
    id: "an_01",
    title: "انطلاق المرحلة الثالثة من منصة تكتنال",
    body: "بعد إنجاز المصادقة ونظام الرتب، تبدأ اليوم المرحلة الثالثة: المشاريع والمهام. المتوقع إطلاق تجريبي خلال خمسة أسابيع. شكراً لكل من ساهم في المرحلتين السابقتين.",
    pinned: true,
    priority: "HIGH",
    authorId: "u_ahmed",
    createdAt: at(2, 9),
  },
  {
    id: "an_02",
    title: "ترقية: ريم الشمري إلى قائدة مشروع أولى",
    body: "بناءً على توصية لجنة التقييم وأداء متميز خلال العام، تمت ترقية ريم الشمري إلى رتبة قائدة مشروع أولى. مبارك، ونعتز بأثرك.",
    pinned: true,
    priority: "MEDIUM",
    authorId: "u_noura",
    createdAt: at(6, 11),
  },
  {
    id: "an_03",
    title: "ورشة إلزامية: أمن البيانات للجميع",
    body: "ستُقام ورشة أمن بيانات يوم الخميس القادم 5 مساءً، الحضور إلزامي لكل الأعضاء. تُحتسب ضمن ساعات التطوير.",
    pinned: false,
    priority: "CRITICAL",
    authorId: "u_dana",
    createdAt: at(1, 15),
  },
];

const notification = (
  id: string,
  userId: string,
  type: Notification["type"],
  title: string,
  body: string,
  href: string | null,
  read: boolean,
  days: number,
  hour = 10,
): Notification => ({ id, userId, type, title, body, href, read, createdAt: at(days, hour) });

export const notifications: Notification[] = [
  notification("n_01", "u_ahmed", "ASSIGNMENT", "مهمة جديدة مسندة إليك", "«تسجيل قرارات الاجتماع التأسيسي» أُسندت إليك بواسطة ريم.", "/tasks", true, 15, 11),
  notification("n_02", "u_ahmed", "DEADLINE", "موعد نهائي غداً", "مهمة «مراجعة نصوص الواجهة العربية» تستحق غداً.", "/tasks", false, 1, 8),
  notification("n_03", "u_ahmed", "MENTION", "ذكرك خالد في تعليق", "«ممتاز، سأضيف مرحلة التنقية إلى خطة المشروع. شكراً @نورة»", "/proposals", false, 0, 9),
  notification("n_04", "u_ahmed", "SUCCESS", "اكتملت مرحلة المصادقة", "أُنجزت مرحلة Auth.js والرتب الديناميكية بنجاح.", "/projects/p_atlas", true, 6, 16),
  notification("n_05", "u_ahmed", "WARNING", "مشروع متوقف", "مشروع «المراجعة الأمنية الشاملة 2026» متوقف بانتظار قرار.", "/projects/p_security", false, 2, 12),
  notification("n_06", "u_ahmed", "INFO", "اجتماع غداً 7:30 م", "الاجتماع الأسبوعي للجنة — قاعة الابتكار.", "/meetings", false, 0, 8),
  notification("n_07", "u_ahmed", "SUCCESS", "تحديث صلاحيات الرتب", "تم تعديل صلاحيات رتبة «قائد مشروع»: إضافة صلاحية رؤية الميزانية.", "/settings", true, 3, 14),
  notification("n_08", "u_ahmed", "SUCCESS", "إنجاز جديد للفريق", "دانة المطيري حصلت على شارة «حامي البيانات».", "/achievements", true, 4, 18),
  notification("n_09", "u_noura", "ASSIGNMENT", "مهمة جديدة", "«مراجعة نصوص الواجهة العربية» أُسندت إليك.", "/tasks", false, 1, 9),
  notification("n_10", "u_noura", "MENTION", "ذكرك أحمد في تعليق", "«شكراً @نورة على المراجعة السريعة»", "/projects/p_atlas", false, 2, 13),
  notification("n_11", "u_reem", "DEADLINE", "مهمة تستحق اليوم", "«صفحة الرتب والصلاحيات» تستحق اليوم.", "/tasks", false, 0, 7),
  notification("n_12", "u_dana", "ASSIGNMENT", "تم إسناد مراجعة أمنية", "«تدقيق صلاحيات لوحة الإعدادات» — أولوية قصوى.", "/tasks", false, 0, 8),
];

export const auditLogs: AuditLog[] = [
  { id: "al_01", actorId: "u_ahmed", action: "RANK_CHANGE", entityType: "user", entityId: "u_reem", summary: "ترقية ريم الشمري من «عضو أساسي» إلى «قائدة مشروع أولى».", createdAt: at(6, 12) },
  { id: "al_02", actorId: "u_noura", action: "UPDATE", entityType: "role", entityId: "role_project_lead", summary: "إضافة صلاحية projects.budget إلى رتبة «قائد مشروع».", createdAt: at(3, 14) },
  { id: "al_03", actorId: "u_ahmed", action: "APPROVE", entityType: "proposal", entityId: "pr_01", summary: "اعتماد اقتراح «مساعد اللجنة الذكي» وتحويله إلى مشروع TCT-03.", createdAt: at(38, 16) },
  { id: "al_04", actorId: "u_dana", action: "UPDATE", entityType: "setting", entityId: null, summary: "تحديث سياسة الاحتفاظ بالبيانات (مسودة).", createdAt: at(1, 11) },
  { id: "al_05", actorId: "u_khalid", action: "CREATE", entityType: "project", entityId: "p_ai", summary: "إنشاء مشروع «مساعد اللجنة الذكي».", createdAt: at(70, 9) },
  { id: "al_06", actorId: "u_mohammed", action: "LOGIN", entityType: "session", entityId: null, summary: "تسجيل دخول عبر Discord OAuth من الرياض.", createdAt: at(0, 8) },
  { id: "al_07", actorId: "u_reem", action: "UPDATE", entityType: "task", entityId: "t_002", summary: "تحديث حالة «صفحة الرتب والصلاحيات» إلى قيد التنفيذ.", createdAt: at(2, 10) },
  { id: "al_08", actorId: "u_noura", action: "CREATE", entityType: "meeting", entityId: "mt_03", summary: "جدولة اجتماع تخطيط الربع القادم.", createdAt: at(5, 15) },
  { id: "al_09", actorId: "u_ahmed", action: "RANK_CHANGE", entityType: "role", entityId: "role_guest", summary: "تعديل صلاحيات رتبة «ضيف» لتشمل عرض الاجتماعات.", createdAt: at(9, 13) },
  { id: "al_10", actorId: "u_dana", action: "DELETE", entityType: "asset", entityId: "as_old", summary: "حذف ملف نسخة احتياطية قديمة (أقدم من 90 يوماً).", createdAt: at(4, 17) },
  { id: "al_11", actorId: "u_jawaher", action: "CREATE", entityType: "article", entityId: "ar_06", summary: "نشر مقال «أول 30 يوماً في اللجنة».", createdAt: at(34, 11) },
  { id: "al_12", actorId: "u_hind", action: "EXPORT", entityType: "report", entityId: null, summary: "تصدير تقرير أداء الأعضاء — أكتوبر (Excel).", createdAt: at(11, 9) },
  { id: "al_13", actorId: "u_khalid", action: "UPDATE", entityType: "project", entityId: "p_security", summary: "تغيير حالة المشروع إلى «متوقف».", createdAt: at(8, 12) },
  { id: "al_14", actorId: "u_ahmed", action: "LOGIN", entityType: "session", entityId: null, summary: "تسجيل دخول ناجح من الرياض.", createdAt: at(0, 9) },
  { id: "al_15", actorId: "u_turki", action: "UPDATE", entityType: "project", entityId: "p_gateway", summary: "تحديث نسبة إنجاز البوابة الموحّدة إلى 54%.", createdAt: at(2, 16) },
  { id: "al_16", actorId: "u_ahmed", action: "UPDATE", entityType: "setting", entityId: null, summary: "تحديث شعار اللجنة واللون الأساسي.", createdAt: at(12, 10) },
];

export const invitations: Invitation[] = [
  {
    id: "inv_01",
    code: "TCT-9F2K",
    email: "sara.new@tectnal.sa",
    roleId: "role_trainee",
    invitedById: "u_noura",
    status: "pending",
    expiresAt: at(-7, 10),
    createdAt: at(3, 10),
  },
  {
    id: "inv_02",
    code: "TCT-4M8Q",
    email: null,
    roleId: "role_member",
    invitedById: "u_ahmed",
    status: "pending",
    expiresAt: at(-10, 12),
    createdAt: at(1, 12),
  },
];

export const settings: Record<string, string | number | boolean> = {
  committeeName: "لجنة التقنية والتحول الرقمي",
  committeeNameEn: "Technology & Digital Transformation Committee",
  tagline: "حيث تُدار الأفكار، وتُنجَز المشاريع، ويُصنَع الأثر.",
  primaryColor: "#7C5CFF",
  accentColor: "#22D3EE",
  warmColor: "#FFB86B",
  logoMark: "ت",
  defaultTheme: "dark",
  allowDiscordLogin: true,
  weeklyDigest: true,
  deadlineReminders: true,
  mentionNotifications: true,
  autoArchiveDays: 90,
  defaultRoleId: "role_trainee",
  fiscalYearStart: "يناير",
};
