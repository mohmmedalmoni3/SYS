"use client";

import type { CSSProperties } from "react";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  History,
  KeyRound,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { AuditEntryView, MemberView, RoleView } from "@/lib/types";
import { PERMISSIONS, PERMISSION_GROUPS, permissionLabel } from "@/lib/permissions";
import { cn, formatDate, relativeTime } from "@/lib/utils";
import { createRole, resetDemoDatabase, updateMemberRole, updateRolePermissions, updateSettings } from "@/server/actions";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field, Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { RoleIcon } from "@/lib/icons";

interface SettingsProps {
  roles: RoleView[];
  members: MemberView[];
  audit: AuditEntryView[];
  settings: Record<string, string | number | boolean>;
  invitations: { id: string; code: string; email: string | null; roleName: string; status: string; expiresAt: string }[];
  canManageRoles: boolean;
  canEditSettings: boolean;
  canViewAudit: boolean;
  canDanger: boolean;
  currentUserId: string;
}

const ACTION_META: Record<string, { label: string; color: string }> = {
  CREATE: { label: "إنشاء", color: "#34D399" },
  UPDATE: { label: "تعديل", color: "#22D3EE" },
  DELETE: { label: "حذف", color: "#FB7185" },
  LOGIN: { label: "دخول", color: "#60A5FA" },
  RANK_CHANGE: { label: "تغيير رتبة", color: "#F5C451" },
  EXPORT: { label: "تصدير", color: "#A78BFA" },
  APPROVE: { label: "اعتماد", color: "#34D399" },
  REJECT: { label: "رفض", color: "#FB7185" },
};

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-5 w-9 rounded-full border transition",
        value ? "border-primary/50 bg-primary/30" : "border-line bg-white/5",
        disabled && "opacity-50",
      )}
      aria-pressed={value}
    >
      <span
        className={cn(
          "absolute top-0.5 size-3.5 rounded-full bg-white transition-all",
          value ? "start-0.5" : "start-4",
        )}
      />
    </button>
  );
}

export function SettingsView({
  roles,
  members,
  audit,
  settings,
  invitations,
  canManageRoles,
  canEditSettings,
  canViewAudit,
  canDanger,
  currentUserId,
}: SettingsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0];
  const [draftPermissions, setDraftPermissions] = useState<string[]>(selectedRole?.permissions ?? []);
  const [auditFilter, setAuditFilter] = useState("ALL");
  const [dangerOpen, setDangerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [brand, setBrand] = useState({
    committeeName: String(settings.committeeName ?? ""),
    tagline: String(settings.tagline ?? ""),
    logoMark: String(settings.logoMark ?? "ت"),
    primaryColor: String(settings.primaryColor ?? "#7C5CFF"),
    accentColor: String(settings.accentColor ?? "#22D3EE"),
  });

  const changedPermissions = useMemo(() => {
    if (!selectedRole) return false;
    const a = [...draftPermissions].sort().join("|");
    const b = [...selectedRole.permissions].sort().join("|");
    return a !== b;
  }, [draftPermissions, selectedRole]);

  const auditFiltered = useMemo(
    () => (auditFilter === "ALL" ? audit : audit.filter((entry) => entry.action === auditFilter)),
    [audit, auditFilter],
  );

  function selectRole(role: RoleView) {
    setSelectedRoleId(role.id);
    setDraftPermissions(role.permissions);
  }

  function togglePermission(key: string) {
    setDraftPermissions((current) =>
      current.includes(key) ? current.filter((permission) => permission !== key) : [...current, key],
    );
  }

  function savePermissions() {
    if (!selectedRole) return;
    startTransition(async () => {
      try {
        await updateRolePermissions(selectedRole.id, draftPermissions);
        toast.success(`حُفظت صلاحيات «${selectedRole.name}»`);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر الحفظ");
      }
    });
  }

  function changeMemberRole(userId: string, roleId: string) {
    startTransition(async () => {
      try {
        await updateMemberRole(userId, roleId);
        toast.success("حُدّثت رتبة العضو");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر تحديث الرتبة");
      }
    });
  }

  function saveBranding() {
    startTransition(async () => {
      try {
        await updateSettings({ ...brand });
        toast.success("حُفظت هوية اللجنة");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر الحفظ");
      }
    });
  }

  function toggleSetting(key: string, value: boolean) {
    startTransition(async () => {
      try {
        await updateSettings({ [key]: value });
        toast.success("حُدّث الإعداد");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر الحفظ");
      }
    });
  }

  function resetDemo() {
    startTransition(async () => {
      try {
        await resetDemoDatabase();
        toast.success("أُعيدت بيانات العرض التجريبية");
        setDangerOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إعادة التعيين");
      }
    });
  }

  function submitRole(formData: FormData) {
    startTransition(async () => {
      try {
        await createRole({
          name: String(formData.get("name") ?? ""),
          nameEn: String(formData.get("nameEn") ?? ""),
          color: String(formData.get("color") ?? "#7C5CFF"),
          level: Number(formData.get("level") ?? 30),
        });
        toast.success("أُنشئت الرتبة");
        setCreateOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إنشاء الرتبة");
      }
    });
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="SETTINGS · 12"
        title="الإعدادات ولوحة الإدارة"
        description="الرتب، الصلاحيات، الهوية، وسجل التدقيق — كل ما يحكم النظام."
        actions={
          <Badge tone="warning" className="py-1.5">
            <ShieldCheck className="size-3" />
            وصول مقيّد
          </Badge>
        }
      />

      <Tabs defaultValue="roles">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="roles">الرتب والصلاحيات</TabsTrigger>
          <TabsTrigger value="members">الأعضاء</TabsTrigger>
          <TabsTrigger value="branding">الهوية</TabsTrigger>
          <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          {canViewAudit ? <TabsTrigger value="audit">سجل التدقيق</TabsTrigger> : null}
          {canDanger ? <TabsTrigger value="danger">منطقة الخطر</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="roles">
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="space-y-2">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => selectRole(role)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-start transition",
                    selectedRole?.id === role.id
                      ? "border-[color-mix(in_oklab,var(--role-color)_45%,transparent)] bg-[color-mix(in_oklab,var(--role-color)_8%,transparent)]"
                      : "border-line/60 hover:border-line",
                  )}
                  style={{ "--role-color": role.color } as CSSProperties}
                >
                  <span className="grid size-9 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${role.color} 16%, transparent)`, color: role.color }}>
                    <RoleIcon icon={role.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.7rem] font-medium">{role.name}</span>
                    <span className="mono block text-[0.5rem] text-muted">LVL {role.level} · {role.userCount} أعضاء</span>
                  </span>
                  <span className="num text-[0.55rem] text-muted">{role.permissions.length}</span>
                </button>
              ))}
              {canDanger ? (
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full border border-dashed border-line">
                      <Plus className="size-3.5" /> رتبة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء رتبة</DialogTitle>
                      <DialogDescription>تبدأ الرتبة بأربع صلاحيات أساسية، ثم عدّلها من المصفوفة.</DialogDescription>
                    </DialogHeader>
                    <form action={submitRole} className="space-y-3">
                      <Field label="اسم الرتبة">
                        <Input name="name" required placeholder="مثال: مستشار تقني" />
                      </Field>
                      <Field label="الاسم بالإنجليزية">
                        <Input name="nameEn" required placeholder="Technical Advisor" dir="ltr" />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="اللون">
                          <Input name="color" type="color" defaultValue="#7C5CFF" className="h-10 p-1" />
                        </Field>
                        <Field label="المستوى (1-99)">
                          <Input name="level" type="number" min={1} max={99} defaultValue={30} />
                        </Field>
                      </div>
                      <Button type="submit" className="w-full" loading={pending}>
                        إنشاء الرتبة
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              ) : null}
            </div>

            {selectedRole ? (
              <SpotlightCard className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-base font-semibold" style={{ color: selectedRole.color }}>
                        {selectedRole.name}
                      </h2>
                      <Badge className="text-[0.5rem]">{selectedRole.isSystem ? "نظامية" : "مخصصة"}</Badge>
                    </div>
                    <p className="mt-1 max-w-lg text-[0.62rem] leading-relaxed text-muted">{selectedRole.description}</p>
                  </div>
                  <div className="text-end">
                    <div className="num text-lg font-semibold">{draftPermissions.length}</div>
                    <div className="text-[0.5rem] text-muted">صلاحية ممنوحة</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupPermissions = PERMISSIONS.filter((permission) => permission.group === group.key);
                    if (groupPermissions.length === 0) return null;
                    const enabled = groupPermissions.filter((permission) => draftPermissions.includes(permission.key)).length;
                    return (
                      <div key={group.key} className="rounded-xl border border-line/60 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[0.66rem] font-medium">
                            {group.label}
                            <span className="num ms-1.5 text-[0.52rem] text-muted">{enabled}/{groupPermissions.length}</span>
                          </span>
                          {canDanger ? (
                            <button
                              type="button"
                              onClick={() => {
                                const keys = groupPermissions.map((permission) => permission.key);
                                const allEnabled = keys.every((key) => draftPermissions.includes(key));
                                setDraftPermissions((current) =>
                                  allEnabled ? current.filter((key) => !keys.includes(key)) : Array.from(new Set([...current, ...keys])),
                                );
                              }}
                              className="text-[0.52rem] text-primary-soft hover:underline"
                            >
                              {enabled === groupPermissions.length ? "إلغاء الكل" : "تحديد الكل"}
                            </button>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {groupPermissions.map((permission) => {
                            const active = draftPermissions.includes(permission.key);
                            return (
                              <button
                                key={permission.key}
                                type="button"
                                disabled={!canDanger}
                                onClick={() => togglePermission(permission.key)}
                                className={cn(
                                  "flex items-center gap-1 rounded-lg border px-2 py-1 text-[0.56rem] transition",
                                  active
                                    ? "border-primary/40 bg-primary/12 text-fg"
                                    : "border-line/60 text-muted hover:text-fg",
                                  !canDanger && "cursor-not-allowed opacity-70",
                                )}
                                title={permission.key}
                              >
                                {active ? <Check className="size-2.5 text-primary-2" /> : null}
                                {permission.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {canDanger ? (
                  <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-2 rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_90%,transparent)] p-2.5 backdrop-blur">
                    <span className="text-[0.58rem] text-muted">
                      {changedPermissions ? "لديك تغييرات غير محفوظة" : "كل التغييرات محفوظة"}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setDraftPermissions(selectedRole.permissions)} disabled={!changedPermissions}>
                        تراجع
                      </Button>
                      <Button size="sm" onClick={savePermissions} loading={pending} disabled={!changedPermissions}>
                        <Save className="size-3.5" /> حفظ الصلاحيات
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2 text-[0.6rem] text-warning">
                    <AlertTriangle className="mb-0.5 me-1 inline size-3" />
                    تعديل الرتب محصور برئيس اللجنة (صلاحية system.danger).
                  </p>
                )}
              </SpotlightCard>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <SpotlightCard className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="size-4 text-primary-soft" />
              <h2 className="font-display text-sm font-semibold">رتب الأعضاء</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>العضو</th>
                    <th>الرتبة الحالية</th>
                    <th>تغيير الرتبة</th>
                    <th>المستوى</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avatar name={member.name} hue={member.avatarHue} size="xs" ring={member.role.color} />
                          <div>
                            <div className="text-[0.66rem]">{member.name}</div>
                            <div className="text-[0.5rem] text-muted">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={member.role} /></td>
                      <td>
                        <select
                          value={member.role.id}
                          disabled={!canDanger || member.id === currentUserId}
                          onChange={(event) => changeMemberRole(member.id, event.target.value)}
                          className="rounded-lg border border-line bg-[var(--surface-2)] px-2 py-1 text-[0.6rem] disabled:opacity-50"
                          aria-label={`رتبة ${member.name}`}
                        >
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="num text-[0.6rem]">{member.level}</td>
                      <td>
                        <Badge tone={member.status === "ACTIVE" ? "success" : "warning"} className="text-[0.5rem]">
                          {member.status === "ACTIVE" ? "نشط" : member.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <KeyRound className="size-4 text-muted" />
                <h3 className="font-display text-sm font-semibold">الدعوات</h3>
              </div>
              <div className="space-y-1.5">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line/60 px-3 py-2 text-[0.6rem]">
                    <span className="mono">{invitation.code}</span>
                    <span className="text-muted">{invitation.email ?? "رابط مفتوح"}</span>
                    <span>{invitation.roleName}</span>
                    <span className="text-muted">تنتهي {formatDate(invitation.expiresAt)}</span>
                    <Badge tone={invitation.status === "pending" ? "warning" : "success"} className="text-[0.48rem]">
                      {invitation.status === "pending" ? "معلّقة" : "مقبولة"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </SpotlightCard>
        </TabsContent>

        <TabsContent value="branding">
          <SpotlightCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="size-4 text-primary-soft" />
              <h2 className="font-display text-sm font-semibold">هوية اللجنة</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <Field label="اسم اللجنة">
                  <Input value={brand.committeeName} onChange={(event) => setBrand({ ...brand, committeeName: event.target.value })} disabled={!canEditSettings} />
                </Field>
                <Field label="الشعار النصي">
                  <Input value={brand.tagline} onChange={(event) => setBrand({ ...brand, tagline: event.target.value })} disabled={!canEditSettings} />
                </Field>
                <Field label="حرف الشعار">
                  <Input value={brand.logoMark} maxLength={2} onChange={(event) => setBrand({ ...brand, logoMark: event.target.value })} disabled={!canEditSettings} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="اللون الأساسي">
                    <Input type="color" value={brand.primaryColor} onChange={(event) => setBrand({ ...brand, primaryColor: event.target.value })} disabled={!canEditSettings} className="h-10 p-1" />
                  </Field>
                  <Field label="لون التمييز">
                    <Input type="color" value={brand.accentColor} onChange={(event) => setBrand({ ...brand, accentColor: event.target.value })} disabled={!canEditSettings} className="h-10 p-1" />
                  </Field>
                </div>
                {canEditSettings ? (
                  <Button onClick={saveBranding} loading={pending} disabled={!canEditSettings}>
                    <Save className="size-3.5" /> حفظ الهوية
                  </Button>
                ) : null}
              </div>
              <div className="glass-soft relative flex flex-col items-center justify-center overflow-hidden rounded-2xl p-6">
                <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 50% 0%, ${brand.primaryColor}, transparent 65%)` }} />
                <div
                  className="relative grid size-16 place-items-center rounded-2xl border font-display text-2xl font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${brand.primaryColor}, ${brand.accentColor})` }}
                >
                  {brand.logoMark || "ت"}
                </div>
                <div className="relative mt-3 font-display text-sm font-bold">{brand.committeeName || "اسم اللجنة"}</div>
                <div className="relative mt-1 text-center text-[0.55rem] text-muted">{brand.tagline || "الشعار النصي"}</div>
                <div className="relative mt-4 flex gap-1">
                  <span className="size-4 rounded-full" style={{ background: brand.primaryColor }} />
                  <span className="size-4 rounded-full" style={{ background: brand.accentColor }} />
                  <span className="size-4 rounded-full bg-[#FFB86B]" />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </TabsContent>

        <TabsContent value="notifications">
          <SpotlightCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-primary-soft" />
              <h2 className="font-display text-sm font-semibold">إعدادات الإشعارات</h2>
            </div>
            <div className="divide-y divide-line/60">
              {[
                { key: "weeklyDigest", label: "الملخص الأسبوعي", description: "بريد يلخص إنجازات اللجنة كل أحد." },
                { key: "deadlineReminders", label: "تذكير المواعيد", description: "تنبيه قبل 24 ساعة من كل استحقاق." },
                { key: "mentionNotifications", label: "الإشارات", description: "إشعار فوري عند ذكرك في تعليق." },
                { key: "allowDiscordLogin", label: "الدخول عبر Discord", description: "السماح للأعضاء بالدخول بحساب Discord." },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="text-[0.68rem] font-medium">{item.label}</div>
                    <div className="text-[0.55rem] text-muted">{item.description}</div>
                  </div>
                  <Toggle
                    value={Boolean(settings[item.key])}
                    disabled={!canEditSettings}
                    onChange={(next) => toggleSetting(item.key, next)}
                  />
                </div>
              ))}
            </div>
          </SpotlightCard>
        </TabsContent>

        {canViewAudit ? (
          <TabsContent value="audit">
            <SpotlightCard className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <History className="size-4 text-primary-soft" />
                  <h2 className="font-display text-sm font-semibold">سجل التدقيق</h2>
                </div>
                <Select value={auditFilter} onChange={(event) => setAuditFilter(event.target.value)} className="h-8 w-auto py-0 text-[0.6rem]">
                  <option value="ALL">كل الإجراءات</option>
                  {Object.entries(ACTION_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الفاعل</th>
                      <th>الإجراء</th>
                      <th>التفاصيل</th>
                      <th>الوقت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditFiltered.map((entry) => {
                      const meta = ACTION_META[entry.action] ?? { label: entry.action, color: "#94A3B8" };
                      return (
                        <tr key={entry.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              {entry.actor ? <Avatar name={entry.actor.name} hue={entry.actor.avatarHue} size="xs" /> : null}
                              <span className="text-[0.62rem]">{entry.actor?.name ?? "النظام"}</span>
                            </div>
                          </td>
                          <td>
                            <span className="chip text-[0.5rem]" style={{ color: meta.color, borderColor: `color-mix(in oklab, ${meta.color} 30%, transparent)` }}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="max-w-md text-[0.6rem] text-muted">{entry.summary}</td>
                          <td className="mono whitespace-nowrap text-[0.52rem] text-muted">{relativeTime(entry.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SpotlightCard>
          </TabsContent>
        ) : null}

        {canDanger ? (
          <TabsContent value="danger">
            <SpotlightCard className="border-danger/25 p-5">
              <div className="flex items-center gap-2 text-danger">
                <AlertTriangle className="size-4" />
                <h2 className="font-display text-sm font-semibold">منطقة الخطر</h2>
              </div>
              <p className="mt-2 max-w-xl text-[0.62rem] leading-relaxed text-muted">
                إعادة تعيين بيانات العرض تحذف كل التعديلات المحلية (مشاريع، مهام، اقتراحات، رسائل) وتعيد الحالة الأصلية.
                هذا الإجراء لا يمكن التراجع عنه، متاح لرئيس اللجنة فقط.
              </p>
              <Dialog open={dangerOpen} onOpenChange={setDangerOpen}>
                <DialogTrigger asChild>
                  <Button variant="danger" size="sm" className="mt-4">
                    <RotateCcw className="size-3.5" /> إعادة تعيين بيانات العرض
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>تأكيد إعادة التعيين</DialogTitle>
                    <DialogDescription>سيتم حذف كل التغييرات المحلية واستعادة البيانات التجريبية الأصلية.</DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setDangerOpen(false)}>
                      إلغاء
                    </Button>
                    <Button variant="danger" size="sm" onClick={resetDemo} loading={pending}>
                      <Trash2 className="size-3.5" /> نعم، أعد التعيين
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-6 rounded-xl border border-line p-4">
                <div className="flex items-center gap-2 text-[0.68rem] font-medium">
                  <Shield className="size-3.5 text-muted" /> حالة النظام
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[0.58rem] text-muted sm:grid-cols-4">
                  <div>الرتب: <span className="num text-fg">{roles.length}</span></div>
                  <div>الأعضاء: <span className="num text-fg">{members.length}</span></div>
                  <div>سجلات التدقيق: <span className="num text-fg">{audit.length}</span></div>
                  <div>وضع البيانات: <span className="text-fg">Demo JSON</span></div>
                </div>
              </div>
            </SpotlightCard>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

