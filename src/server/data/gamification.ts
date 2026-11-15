import type { Achievement, Badge, PointTransaction, UserBadge } from "./types";

const at = (days: number, hour = 20) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const badges: Badge[] = [
  { id: "b_first", key: "first-step", name: "الخطوة الأولى", description: "أول مهمة مكتملة في اللجنة.", icon: "footprints", color: "#60A5FA", rarity: "common" },
  { id: "b_builder", key: "builder", name: "بنّاء", description: "أنجز 25 مهمة تطويرية.", icon: "hammer", color: "#34D399", rarity: "rare" },
  { id: "b_architect", key: "architect", name: "معماري", description: "قاد تصميم نظام أو بنية تقنية معتمدة.", icon: "blocks", color: "#A78BFA", rarity: "epic" },
  { id: "b_mentor", key: "mentor", name: "مرشد", description: "رافق عضواً جديداً حتى أول إنجاز.", icon: "graduation-cap", color: "#F5C451", rarity: "rare" },
  { id: "b_guardian", key: "guardian", name: "حامي البيانات", description: "أنجز مراجعة أمنية كاملة.", icon: "shield", color: "#FB7185", rarity: "epic" },
  { id: "b_ideator", key: "ideator", name: "صاحب الفكرة", description: "اقتراح تحوّل إلى مشروع منشور.", icon: "lightbulb", color: "#22D3EE", rarity: "rare" },
  { id: "b_streak", key: "streak", name: "ثبات", description: "حضر 10 اجتماعات متتالية.", icon: "flame", color: "#FFB86B", rarity: "rare" },
  { id: "b_legend", key: "legend", name: "أسطورة تكتنال", description: "أثر استثنائي عبر أكثر من عام.", icon: "crown", color: "#F5C451", rarity: "legendary" },
];

export const achievements: Achievement[] = [
  { id: "a_01", userId: "u_ahmed", title: "قائد العام", description: "قاد اللجنة خلال سنة كاملة من النمو.", points: 500, icon: "crown", rarity: "legendary", earnedAt: at(-30), awardedById: null },
  { id: "a_02", userId: "u_noura", title: "مهندسة التجربة", description: "أعادت تصميم رحلة العضو بالكامل.", points: 220, icon: "sparkles", rarity: "epic", earnedAt: at(-18), awardedById: "u_ahmed" },
  { id: "a_03", userId: "u_khalid", title: "معماري المنصة", description: "صمّم معمارية الإصدار الثاني.", points: 260, icon: "blocks", rarity: "epic", earnedAt: at(-22), awardedById: "u_ahmed" },
  { id: "a_04", userId: "u_reem", title: "قائدة لا تتوقف", description: "رفعت إنجاز المشروع من 40% إلى 68% في شهر.", points: 180, icon: "rocket", rarity: "rare", earnedAt: at(-7), awardedById: "u_noura" },
  { id: "a_05", userId: "u_abdullah", title: "سيد التفاصيل", description: "سلّم نظام التصميم قبل الموعد.", points: 150, icon: "wand", rarity: "rare", earnedAt: at(-9), awardedById: "u_lama" },
  { id: "a_06", userId: "u_dana", title: "حامية البيانات", description: "أغلقت 7 ثغرات في المراجعة الأولى.", points: 200, icon: "shield-check", rarity: "epic", earnedAt: at(-4), awardedById: "u_ahmed" },
  { id: "a_07", userId: "u_lama", title: "عين الجمال", description: "أنهت هوية شاشة الدخول.", points: 120, icon: "palette", rarity: "common", earnedAt: at(-6), awardedById: "u_noura" },
  { id: "a_08", userId: "u_mohammed", title: "موثّق الخدمات", description: "وثّق 12 واجهة API.", points: 110, icon: "code", rarity: "common", earnedAt: at(-12), awardedById: "u_khalid" },
  { id: "a_09", userId: "u_hind", title: "قارئة الأرقام", description: "قدّمت تحليلاً غيّر أولويات الربع.", points: 140, icon: "bar-chart", rarity: "rare", earnedAt: at(-11), awardedById: "u_noura" },
  { id: "a_10", userId: "u_jawaher", title: "كاتبة المعرفة", description: "نشرت 8 مقالات في شهر واحد.", points: 100, icon: "book-open", rarity: "common", earnedAt: at(-3), awardedById: "u_noura" },
  { id: "a_11", userId: "u_faisal", title: "أول خطوة", description: "أنجز أول مهمة في اللجنة.", points: 40, icon: "footprints", rarity: "common", earnedAt: at(-8), awardedById: "u_mohammed" },
  { id: "a_12", userId: "u_turki", title: "رابط الأنظمة", description: "أنجز تكامل Discord OAuth.", points: 130, icon: "link", rarity: "common", earnedAt: at(-20), awardedById: "u_khalid" },
  { id: "a_13", userId: "u_saad", title: "بداية الرحلة", description: "أكمل أول تقرير بيانات.", points: 40, icon: "sparkles", rarity: "common", earnedAt: at(-2), awardedById: "u_hind" },
  { id: "a_14", userId: "u_ahmed", title: "صاحب الرؤية", description: "أطلق مبادرة مساعد اللجنة الذكي.", points: 200, icon: "lightbulb", rarity: "epic", earnedAt: at(-15), awardedById: null },
  { id: "a_15", userId: "u_reem", title: "حاضرة دائماً", description: "حضرت 10 اجتماعات متتالية.", points: 80, icon: "flame", rarity: "rare", earnedAt: at(-5), awardedById: "u_ahmed" },
  { id: "a_16", userId: "u_mona", title: "عين الحوكمة", description: "راجعت سياسة الاحتفاظ بالبيانات.", points: 90, icon: "scale", rarity: "common", earnedAt: at(-10), awardedById: "u_dana" },
];

export const userBadges: UserBadge[] = [
  { userId: "u_ahmed", badgeKey: "legend", earnedAt: at(-30) },
  { userId: "u_ahmed", badgeKey: "architect", earnedAt: at(-60) },
  { userId: "u_ahmed", badgeKey: "streak", earnedAt: at(-5) },
  { userId: "u_noura", badgeKey: "mentor", earnedAt: at(-18) },
  { userId: "u_noura", badgeKey: "ideator", earnedAt: at(-75) },
  { userId: "u_khalid", badgeKey: "architect", earnedAt: at(-22) },
  { userId: "u_khalid", badgeKey: "builder", earnedAt: at(-40) },
  { userId: "u_reem", badgeKey: "streak", earnedAt: at(-5) },
  { userId: "u_reem", badgeKey: "ideator", earnedAt: at(-60) },
  { userId: "u_abdullah", badgeKey: "builder", earnedAt: at(-9) },
  { userId: "u_dana", badgeKey: "guardian", earnedAt: at(-4) },
  { userId: "u_lama", badgeKey: "ideator", earnedAt: at(-55) },
  { userId: "u_mohammed", badgeKey: "builder", earnedAt: at(-12) },
  { userId: "u_jawaher", badgeKey: "mentor", earnedAt: at(-3) },
  { userId: "u_faisal", badgeKey: "first-step", earnedAt: at(-8) },
  { userId: "u_saad", badgeKey: "first-step", earnedAt: at(-2) },
  { userId: "u_turki", badgeKey: "builder", earnedAt: at(-20) },
];

export const pointTransactions: PointTransaction[] = [
  { id: "pt_01", userId: "u_reem", points: 180, reason: "رفع إنجاز المشروع", source: "achievement", createdAt: at(-7) },
  { id: "pt_02", userId: "u_dana", points: 200, reason: "إغلاق ثغرات أمنية", source: "achievement", createdAt: at(-4) },
  { id: "pt_03", userId: "u_abdullah", points: 40, reason: "إنجاز 5 مهام", source: "task", createdAt: at(-9) },
  { id: "pt_04", userId: "u_hind", points: 140, reason: "تحليل غيّر الأولويات", source: "achievement", createdAt: at(-11) },
  { id: "pt_05", userId: "u_jawaher", points: 100, reason: "نشر 8 مقالات", source: "achievement", createdAt: at(-3) },
  { id: "pt_06", userId: "u_ahmed", points: 500, reason: "قائد العام", source: "achievement", createdAt: at(-30) },
  { id: "pt_07", userId: "u_noura", points: 220, reason: "إعادة تصميم الرحلة", source: "achievement", createdAt: at(-18) },
  { id: "pt_08", userId: "u_faisal", points: 40, reason: "أول مهمة", source: "achievement", createdAt: at(-8) },
  { id: "pt_09", userId: "u_saad", points: 40, reason: "أول تقرير", source: "achievement", createdAt: at(-2) },
  { id: "pt_10", userId: "u_mohammed", points: 110, reason: "توثيق API", source: "achievement", createdAt: at(-12) },
  { id: "pt_11", userId: "u_lama", points: 120, reason: "هوية شاشة الدخول", source: "achievement", createdAt: at(-6) },
  { id: "pt_12", userId: "u_turki", points: 130, reason: "تكامل Discord", source: "achievement", createdAt: at(-20) },
];
