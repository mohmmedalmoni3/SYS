"use client";

import type { CSSProperties } from "react";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Building2,
  Check,
  Copy,
  LayoutGrid,
  Mail,
  Network,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Table2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { MemberView, RoleView } from "@/lib/types";
import { cn, formatDate, formatNumber, relativeTime } from "@/lib/utils";
import { inviteMember } from "@/server/actions";
import { useClipboard } from "@/hooks/use-utility";
import { Button } from "@/components/ui/button";
import { Badge, RoleBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { RoleIcon, BadgeIcon } from "@/lib/icons";

type ViewMode = "cards" | "org" | "table";

function HolographicCard({ member }: { member: MemberView }) {
  return (
    <Link href={`/members/${member.id}`} className="group block">
      <div
        className="relative h-full overflow-hidden rounded-[1.4rem] border border-line bg-[color-mix(in_oklab,var(--surface)_78%,transparent)] p-4 transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_70px_-40px_var(--role-color)]"
        style={{ "--role-color": member.role.color } as CSSProperties}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] transition group-hover:opacity-25"
          style={{ background: `radial-gradient(circle at 80% 0%, ${member.role.color}, transparent 55%)` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${member.role.color}, transparent)` }}
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -inset-x-10 top-0 h-24 -translate-y-full rotate-12 bg-gradient-to-b from-white/12 to-transparent transition-transform duration-700 group-hover:translate-y-[220%]" />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="relative">
            <Avatar name={member.name} hue={member.avatarHue} size="xl" ring={member.role.color} />
            <span
              className="absolute -bottom-1 -end-1 grid size-6 place-items-center rounded-full border border-[var(--bg)]"
              style={{ background: member.role.color, color: "#08040f" }}
            >
              <RoleIcon icon={member.role.icon} className="size-3" />
            </span>
          </div>
          <div className="text-end">
            <div className="num text-[0.6rem] text-muted">LVL {member.level}</div>
            <div className="num text-sm font-semibold" style={{ color: member.role.color }}>
              {formatNumber(member.points)}
            </div>
            <div className="text-[0.46rem] text-muted">نقطة</div>
          </div>
        </div>

        <div className="relative mt-3">
          <h3 className="font-display text-sm font-semibold">{member.name}</h3>
          <p className="mt-0.5 text-[0.6rem] text-muted">{member.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <RoleBadge role={member.role} className="text-[0.5rem]" />
            <span className="chip text-[0.48rem]">{member.department}</span>
          </div>
        </div>

        <div className="relative mt-3 flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="rounded-md bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] px-1.5 py-0.5 text-[0.48rem] text-muted">
              {skill}
            </span>
          ))}
          {member.skills.length > 3 ? (
            <span className="rounded-md bg-[color-mix(in_oklab,var(--fg)_5%,transparent)] px-1.5 py-0.5 text-[0.48rem] text-muted">
              +{member.skills.length - 3}
            </span>
          ) : null}
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-1.5 border-t border-line pt-2.5 text-center">
          {[
            { label: "مهام", value: member.stats.tasksDone },
            { label: "مشاريع", value: member.stats.projects },
            { label: "حضور", value: `${member.stats.attendanceRate}%` },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="num text-[0.7rem] font-medium">{stat.value}</div>
              <div className="text-[0.46rem] text-muted">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="relative mt-2.5 flex items-center justify-between gap-1">
          <div className="flex -space-x-1 space-x-reverse">
            {member.badges.slice(0, 4).map((badge) => (
              <span
                key={badge.key}
                title={badge.name}
                className="grid size-5 place-items-center rounded-full border border-[var(--bg)]"
                style={{ background: `color-mix(in oklab, ${badge.color} 28%, transparent)`, color: badge.color }}
              >
                <BadgeIcon icon={badge.icon} className="size-2.5" />
              </span>
            ))}
          </div>
          <span className="text-[0.48rem] text-muted">{member.badges.length} شارة</span>
        </div>
      </div>
    </Link>
  );
}

function OrgChart({ members }: { members: MemberView[] }) {
  const tiers = [
    { label: "القيادة", levels: [100, 90] },
    { label: "الإدارة", levels: [70, 55] },
    { label: "الأعضاء", levels: [40, 20, 10] },
  ];

  return (
    <SpotlightCard className="p-6">
      <div className="space-y-8">
        {tiers.map((tier) => {
          const list = members.filter((member) => tier.levels.includes(member.role.level));
          return (
            <div key={tier.label}>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px w-6 bg-line-strong" />
                <span className="kicker text-[0.52rem]">{tier.label}</span>
                <span className="num text-[0.5rem] text-muted">{list.length}</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {list.map((member) => (
                  <Link
                    key={member.id}
                    href={`/members/${member.id}`}
                    className="group flex w-40 flex-col items-center rounded-2xl border border-line bg-[color-mix(in_oklab,var(--surface)_70%,transparent)] p-3 text-center transition hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--role-color)_50%,transparent)]"
                    style={{ "--role-color": member.role.color } as CSSProperties}
                  >
                    <Avatar name={member.name} hue={member.avatarHue} size="md" ring={member.role.color} />
                    <div className="mt-2 truncate text-[0.68rem] font-medium">{member.name}</div>
                    <div className="truncate text-[0.5rem]" style={{ color: member.role.color }}>
                      {member.role.name}
                    </div>
                    <div className="num mt-1 text-[0.5rem] text-muted">{member.stats.tasksDone} مهمة منجزة</div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SpotlightCard>
  );
}

export function MembersView({
  members,
  roles,
  canInvite,
}: {
  members: MemberView[];
  roles: RoleView[];
  canInvite: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("cards");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { copy, copied } = useClipboard();

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return members.filter((member) => {
      if (roleFilter !== "ALL" && member.role.id !== roleFilter) return false;
      if (!normalized) return true;
      return (
        member.name.toLowerCase().includes(normalized) ||
        member.title.toLowerCase().includes(normalized) ||
        member.skills.some((skill) => skill.toLowerCase().includes(normalized))
      );
    });
  }, [members, query, roleFilter]);

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        const result = await inviteMember(String(formData.get("email") ?? ""), String(formData.get("roleId") ?? ""));
        setInviteCode(result.code);
        toast.success("أُنشئت الدعوة");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إنشاء الدعوة");
      }
    });
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="MEMBERS · 05"
        title="أعضاء اللجنة"
        description="الناس الذين يصنعون الأثر: مهاراتهم، رتبهم، إنجازاتهم، ومساهماتهم."
        actions={
          canInvite ? (
            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next);
                if (!next) setInviteCode(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" className="btn-shimmer">
                  <UserPlus className="size-3.5" />
                  دعوة عضو
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>دعوة عضو جديد</DialogTitle>
                  <DialogDescription>أرسل بريداً بدعوة، أو شارك الكود مباشرة. تنتهي الدعوة بعد 7 أيام.</DialogDescription>
                </DialogHeader>
                {inviteCode ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
                      <div className="text-[0.6rem] text-success">كود الدعوة جاهز</div>
                      <div className="mono mt-1 text-2xl font-bold tracking-widest">{inviteCode}</div>
                    </div>
                    <Button className="w-full" variant="ghost" onClick={() => copy(`${window.location.origin}/sign-in?invite=${inviteCode}`)}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? "تم النسخ" : "نسخ رابط الدعوة"}
                    </Button>
                    <Button className="w-full" size="sm" onClick={() => setOpen(false)}>
                      تم
                    </Button>
                  </div>
                ) : (
                  <form action={submit} className="space-y-3">
                    <Field label="البريد الإلكتروني">
                      <Input name="email" type="email" required placeholder="name@tectnal.sa" />
                    </Field>
                    <Field label="الرتبة">
                      <Select name="roleId" defaultValue="role_trainee">
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} — مستوى {role.level}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Button type="submit" className="w-full" loading={pending}>
                      <Send className="size-4" />
                      إرسال الدعوة
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-3.5 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالاسم أو المهارة…" className="field h-9 ps-9 text-xs" />
        </div>
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="field h-9 w-auto py-0 text-xs">
          <option value="ALL">كل الرتب</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <div className="flex rounded-lg border border-line p-0.5">
          {[
            { key: "cards" as const, icon: LayoutGrid, label: "بطاقات" },
            { key: "org" as const, icon: Network, label: "هيكل" },
            { key: "table" as const, icon: Table2, label: "جدول" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              title={item.label}
              className={cn(
                "grid size-8 place-items-center rounded-md transition",
                view === item.key ? "bg-[color-mix(in_oklab,var(--primary)_20%,transparent)] text-fg" : "text-muted hover:text-fg",
              )}
            >
              <item.icon className="size-3.5" />
            </button>
          ))}
        </div>
        <span className="num ms-auto text-[0.58rem] text-muted">{filtered.length} عضو</span>
      </div>

      {view === "cards" ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((member) => (
            <HolographicCard key={member.id} member={member} />
          ))}
        </div>
      ) : view === "org" ? (
        <OrgChart members={filtered} />
      ) : (
        <div className="glass overflow-x-auto rounded-[var(--radius)] p-2">
          <table className="data-table">
            <thead>
              <tr>
                <th>العضو</th>
                <th>الرتبة</th>
                <th>القسم</th>
                <th>المهارات</th>
                <th>النقاط</th>
                <th>الحضور</th>
                <th>الانضمام</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} hue={member.avatarHue} size="sm" ring={member.role.color} />
                      <div>
                        <div className="text-[0.7rem] font-medium">{member.name}</div>
                        <div className="text-[0.55rem] text-muted">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><RoleBadge role={member.role} /></td>
                  <td className="text-[0.65rem]">{member.department}</td>
                  <td>
                    <div className="flex max-w-48 flex-wrap gap-1">
                      {member.skills.slice(0, 2).map((skill) => (
                        <span key={skill} className="chip text-[0.48rem]">{skill}</span>
                      ))}
                    </div>
                  </td>
                  <td className="num text-[0.65rem]">{formatNumber(member.points)}</td>
                  <td>
                    <div className="flex w-20 items-center gap-1.5">
                      <Progress value={member.stats.attendanceRate} className="h-1" />
                      <span className="num text-[0.5rem] text-muted">{member.stats.attendanceRate}%</span>
                    </div>
                  </td>
                  <td className="text-[0.6rem] text-muted">{formatDate(member.joinedAt)}</td>
                  <td>
                    <Link href={`/members/${member.id}`} className="text-[0.62rem] text-primary-soft hover:underline">
                      الملف
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "أعضاء نشطون", value: members.filter((member) => member.status === "ACTIVE").length, icon: Users, color: "#22D3EE" },
          { label: "رتب مخصصة", value: roles.length, icon: ShieldCheck, color: "#A78BFA" },
          { label: "إجمالي النقاط", value: formatNumber(members.reduce((sum, member) => sum + member.points, 0)), icon: Award, color: "#FFB86B" },
          { label: "أقسام", value: new Set(members.map((member) => member.department)).size, icon: Building2, color: "#34D399" },
        ].map((stat) => (
          <div key={stat.label} className="glass flex items-center gap-2.5 rounded-xl p-3">
            <span className="grid size-8 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${stat.color} 14%, transparent)`, color: stat.color }}>
              <stat.icon className="size-4" />
            </span>
            <div>
              <div className="num text-sm font-semibold">{stat.value}</div>
              <div className="text-[0.55rem] text-muted">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

