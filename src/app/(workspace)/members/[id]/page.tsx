import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Trophy,
  Zap,
} from "lucide-react";
import { requirePermission } from "@/server/guard";
import { getAchievements, getLeaderboard, getMember, getProjects, getTasks } from "@/server/repository";
import { cn, formatDate, formatNumber, relativeTime } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge, PriorityBadge, RoleBadge, StatusBadge } from "@/components/ui/badge";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { BadgeIcon, RoleIcon } from "@/lib/icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const member = await getMember(id);
  return { title: member?.name ?? "عضو" };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("members.view");
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  const [projects, tasks, achievements, leaderboard] = await Promise.all([
    getProjects(),
    getTasks(),
    getAchievements(60),
    getLeaderboard(),
  ]);

  const memberProjects = projects.filter(
    (project) => project.owner.id === member.id || project.members.some((entry) => entry.id === member.id),
  );
  const memberTasks = tasks.filter((task) => task.assignee?.id === member.id).slice(0, 6);
  const memberAchievements = achievements.filter((achievement) => achievement.member.id === member.id);
  const rank = leaderboard.find((entry) => entry.member.id === member.id)?.rank ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[0.65rem] text-muted">
        <Link href="/members" className="flex items-center gap-1 hover:text-fg">
          <ArrowRight className="size-3" /> الأعضاء
        </Link>
        <span>/</span>
        <span>{member.name}</span>
      </div>

      <div className="glass relative overflow-hidden rounded-[1.6rem]">
        <div
          className="h-28 w-full opacity-70"
          style={{
            background: `radial-gradient(120% 140% at 80% 0%, ${member.role.color}55, transparent 60%), linear-gradient(120deg, #14102a, #0a0c1a)`,
          }}
        />
        <div className="relative px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="rounded-full ring-4 ring-[var(--bg)]">
                <Avatar name={member.name} hue={member.avatarHue} size="2xl" ring={member.role.color} />
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-bold">{member.name}</h1>
                  <RoleBadge role={member.role} />
                  {member.status === "ACTIVE" ? <Badge tone="success">نشط</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted">{member.title} · {member.department}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.6rem] text-muted">
                  <span className="flex items-center gap-1"><Mail className="size-3" /> {member.email}</span>
                  <span className="flex items-center gap-1"><Phone className="size-3" /> <span dir="ltr">{member.phone}</span></span>
                  <span className="flex items-center gap-1"><MapPin className="size-3" /> {member.location}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="size-3" /> انضم {formatDate(member.joinedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="num text-lg font-bold" style={{ color: member.role.color }}>#{rank}</div>
                <div className="text-[0.5rem] text-muted">الترتيب</div>
              </div>
              <ProgressRing value={Math.round((member.points % 400) / 4)} size={68} stroke={5} color={member.role.color}>
                <div className="text-center">
                  <div className="num text-sm font-semibold">{member.level}</div>
                  <div className="text-[0.42rem] text-muted">المستوى</div>
                </div>
              </ProgressRing>
            </div>
          </div>

          <p className="mt-4 max-w-3xl text-xs leading-relaxed text-muted">{member.bio}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {member.skills.map((skill) => (
              <Badge key={skill} className="text-[0.55rem]">{skill}</Badge>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-5">
            {[
              { label: "النقاط", value: formatNumber(member.points), icon: Zap, color: "#FFB86B" },
              { label: "المهام المنجزة", value: member.stats.tasksDone, icon: CheckCircle2, color: "#34D399" },
              { label: "المهام المفتوحة", value: member.stats.tasksOpen, icon: CheckCircle2, color: "#22D3EE" },
              { label: "المشاريع", value: member.stats.projects, icon: Trophy, color: "#A78BFA" },
              { label: "الالتزام", value: `${member.stats.attendanceRate}%`, icon: CalendarDays, color: "#60A5FA" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_55%,transparent)] px-3 py-2">
                <div className="flex items-center gap-1 text-[0.52rem] text-muted">
                  <stat.icon className="size-2.5" style={{ color: stat.color }} />
                  {stat.label}
                </div>
                <div className="num mt-1 text-sm font-semibold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <SpotlightCard className="p-5">
            <h2 className="mb-3 font-display text-sm font-semibold">المشاريع</h2>
            <div className="space-y-2">
              {memberProjects.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">لا مشاريع حالياً</p>
              ) : (
                memberProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line/60 p-2.5 transition hover:border-primary/30"
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: project.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.7rem] font-medium">{project.name}</div>
                      <div className="mono text-[0.5rem] text-muted">{project.code}</div>
                    </div>
                    <div className="w-24">
                      <Progress value={project.progress} color={project.color} className="h-1" />
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))
              )}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-5">
            <h2 className="mb-3 font-display text-sm font-semibold">أحدث المهام</h2>
            <div className="space-y-1.5">
              {memberTasks.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">لا مهام مسندة</p>
              ) : (
                memberTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg border border-line/50 px-2.5 py-2">
                    <span className={cn("size-1.5 rounded-full", task.status === "DONE" ? "bg-success" : "bg-primary-2")} />
                    <span className={cn("min-w-0 flex-1 truncate text-[0.66rem]", task.status === "DONE" && "text-muted line-through")}>
                      {task.title}
                    </span>
                    <PriorityBadge priority={task.priority} className="text-[0.45rem]" />
                  </div>
                ))
              )}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-5">
            <h2 className="mb-3 font-display text-sm font-semibold">سجل الإنجازات</h2>
            <div className="space-y-2.5">
              {memberAchievements.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">لا إنجازات بعد</p>
              ) : (
                memberAchievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-start gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-primary-soft">
                      <Trophy className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[0.7rem] font-medium">{achievement.title}</span>
                        <span className="num text-[0.55rem] text-success">+{achievement.points}</span>
                      </div>
                      <p className="text-[0.58rem] text-muted">{achievement.description}</p>
                      <span className="mono text-[0.48rem] text-muted/60">{relativeTime(achievement.earnedAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SpotlightCard>
        </div>

        <div className="space-y-4">
          <SpotlightCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold">الشارات</h2>
              <span className="num text-[0.55rem] text-muted">{member.badges.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {member.badges.map((badge) => (
                <div
                  key={badge.key}
                  className="flex flex-col items-center gap-1 rounded-xl border border-line/60 p-2 text-center"
                  title={badge.description}
                >
                  <span
                    className="grid size-9 place-items-center rounded-full"
                    style={{ background: `color-mix(in oklab, ${badge.color} 16%, transparent)`, color: badge.color, boxShadow: `0 0 18px -6px ${badge.color}` }}
                  >
                    <BadgeIcon icon={badge.icon} className="size-4" />
                  </span>
                  <span className="line-clamp-1 text-[0.5rem] text-muted">{badge.name}</span>
                </div>
              ))}
              {member.badges.length === 0 ? <p className="col-span-3 py-3 text-center text-[0.6rem] text-muted">لا شارات بعد</p> : null}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-5">
            <h2 className="mb-3 font-display text-sm font-semibold">الرتبة والصلاحيات</h2>
            <div className="flex items-center gap-2.5">
              <span
                className="grid size-9 place-items-center rounded-xl"
                style={{ background: `color-mix(in oklab, ${member.role.color} 16%, transparent)`, color: member.role.color }}
              >
                <RoleIcon icon={member.role.icon} className="size-4" />
              </span>
              <div>
                <div className="text-[0.72rem] font-semibold" style={{ color: member.role.color }}>{member.role.name}</div>
                <div className="mono text-[0.5rem] text-muted">LEVEL {member.role.level}</div>
              </div>
            </div>
            <p className="mt-3 text-[0.62rem] leading-relaxed text-muted">
              الرتبة تحدد الصفحات والأزرار والحقول المتاحة. تُعدَّل من لوحة الإدارة وتُسجَّل في سجل التدقيق.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-5">
            <h2 className="mb-3 font-display text-sm font-semibold">آخر نشاط</h2>
            <div className="space-y-2 text-[0.62rem] text-muted">
              <div className="flex items-center justify-between">
                <span>آخر ظهور</span>
                <span className="text-fg">{relativeTime(member.lastActiveAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الانضمام</span>
                <span className="text-fg">{formatDate(member.joinedAt, true)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>القسم</span>
                <span className="text-fg">{member.department}</span>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </div>
  );
}
