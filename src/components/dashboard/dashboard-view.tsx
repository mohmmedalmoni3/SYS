"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  GripVertical,
  Layers,
  ListTodo,
  LogIn,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trash2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { DashboardView, TaskView, TrendPoint } from "@/lib/types";
import { cn, deadlineLabel, formatCurrency, formatDate, formatTime, isOverdue, relativeTime } from "@/lib/utils";
import { moveTask } from "@/server/actions";
import { useConfetti } from "@/hooks/use-confetti";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Progress, ProgressRing, Sparkline } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/empty-state";
import { CountUp, Delta } from "@/components/fx/count-up";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { TextReveal } from "@/components/fx/reveal";
import { VelocityChart, WorkloadChart } from "./dashboard-charts";

type WidgetId =
  | "hero"
  | "kpis"
  | "velocity"
  | "workload"
  | "myTasks"
  | "activity"
  | "deadlines"
  | "projects"
  | "team"
  | "leaderboard"
  | "proposals"
  | "meetings";

const DEFAULT_ORDER: WidgetId[] = [
  "hero",
  "kpis",
  "velocity",
  "workload",
  "myTasks",
  "activity",
  "deadlines",
  "projects",
  "team",
  "leaderboard",
  "proposals",
  "meetings",
];

const SPANS: Record<WidgetId, string> = {
  hero: "col-span-12 lg:col-span-7",
  kpis: "col-span-12 lg:col-span-5",
  velocity: "col-span-12 lg:col-span-8",
  workload: "col-span-12 md:col-span-6 lg:col-span-4",
  myTasks: "col-span-12 lg:col-span-5",
  activity: "col-span-12 md:col-span-6 lg:col-span-4",
  deadlines: "col-span-12 md:col-span-6 lg:col-span-3",
  projects: "col-span-12 lg:col-span-7",
  team: "col-span-12 md:col-span-6 lg:col-span-5",
  leaderboard: "col-span-12 md:col-span-6 lg:col-span-5",
  proposals: "col-span-12 md:col-span-6 lg:col-span-4",
  meetings: "col-span-12 md:col-span-6 lg:col-span-3",
};

const ACTION_ICON = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
  RANK_CHANGE: ShieldCheck,
  EXPORT: ArrowUpRight,
  APPROVE: CheckCircle2,
  REJECT: Circle,
} as const;

function WidgetCard({
  title,
  kicker,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  kicker: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <SpotlightCard className={cn("flex h-full flex-col p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl border border-line bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-primary-soft">
            <Icon className="size-4" />
          </span>
          <div>
            <h3 className="font-display text-[0.82rem] font-semibold">{title}</h3>
            <div className="kicker mt-0.5 text-[0.48rem]">{kicker}</div>
          </div>
        </div>
        {action}
      </div>
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </SpotlightCard>
  );
}

function SortableWidget({
  id,
  editing,
  children,
}: {
  id: string;
  editing: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(SPANS[id as WidgetId], isDragging && "z-20 opacity-80")}
    >
      <div className={cn("relative h-full", editing && "rounded-[var(--radius)] outline-2 outline-dashed outline-primary/40")}>
        {editing ? (
          <button
            type="button"
            className="absolute -top-3 start-4 z-30 flex cursor-grab items-center gap-1 rounded-full border border-primary/40 bg-[var(--surface)] px-2 py-1 text-[0.55rem] text-primary-soft active:cursor-grabbing"
            {...attributes}
            {...listeners}
            aria-label="اسحب لإعادة الترتيب"
          >
            <GripVertical className="size-3" />
            تحريك
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function DashboardView({ data }: { data: DashboardView }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<WidgetId[]>(DEFAULT_ORDER);
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const { fire } = useConfetti();

  useEffect(() => {
    const stored = localStorage.getItem("tectnal:dashboard-order");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as WidgetId[];
      if (Array.isArray(parsed) && parsed.length === DEFAULT_ORDER.length) setOrder(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = arrayMove(order, order.indexOf(active.id as WidgetId), order.indexOf(over.id as WidgetId));
    setOrder(next);
    localStorage.setItem("tectnal:dashboard-order", JSON.stringify(next));
  }

  function resetOrder() {
    setOrder(DEFAULT_ORDER);
    localStorage.removeItem("tectnal:dashboard-order");
    toast.success("تمت إعادة ترتيب اللوحة الافتراضي");
  }

  function completeTask(task: TaskView) {
    setPendingTask(task.id);
    startTransition(async () => {
      try {
        await moveTask(task.id, "DONE");
        fire({ count: 70 });
        toast.success("أُنجزت المهمة · +10 نقاط");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر تحديث المهمة");
      } finally {
        setPendingTask(null);
      }
    });
  }

  const kpis = useMemo(
    () => [
      {
        label: "أعضاء نشطون",
        value: data.stats.members,
        icon: Users,
        color: "#A78BFA",
        delta: 8,
        spark: [8, 9, 9, 10, 11, 12, 12, 14],
      },
      {
        label: "مشاريع نشطة",
        value: data.stats.activeProjects,
        icon: Layers,
        color: "#22D3EE",
        delta: 12,
        spark: [3, 4, 4, 5, 5, 6, 6, 8],
      },
      {
        label: "معدل الإنجاز",
        value: data.stats.completionRate,
        suffix: "%",
        icon: Target,
        color: "#34D399",
        delta: 6,
        spark: [52, 58, 55, 63, 68, 71, 74, data.stats.completionRate],
      },
      {
        label: "نقاط هذا الشهر",
        value: data.stats.pointsThisMonth,
        icon: Zap,
        color: "#FFB86B",
        delta: 18,
        spark: [120, 180, 160, 240, 300, 280, 360, data.stats.pointsThisMonth],
      },
    ],
    [data.stats],
  );

  const widgets: Record<WidgetId, React.ReactNode> = {
    hero: (
      <SpotlightCard className="relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden p-6">
        <div className="pointer-events-none absolute -end-24 -top-24 size-72 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_65%)] blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -start-10 size-56 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary-2)_25%,transparent),transparent_65%)] blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <span className="live-dot" />
            <span className="kicker text-[0.55rem]">LIVE · {formatDate(new Date())}</span>
          </div>
          <h2 className="display-page leading-tight">
            أهلاً بعودتك، <span className="text-gradient">{data.me.name.split(" ")[0]}</span>
          </h2>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
            {data.stats.openTasks} مهمة مفتوحة، {data.stats.overdueTasks} متأخرة، و{data.upcomingMeetings.length} اجتماعات
            قادمة. لنبدأ بالأهم.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/tasks" className="btn btn-primary btn-shimmer text-xs">
              <ListTodo className="size-3.5" />
              مهام اليوم
            </Link>
            <Link href="/projects" className="btn btn-ghost text-xs">
              <Layers className="size-3.5" />
              استعراض المشاريع
            </Link>
            <Link href="/reports" className="btn btn-ghost text-xs">
              <TrendingUp className="size-3.5" />
              التقرير الأسبوعي
            </Link>
          </div>
        </div>

        <div className="relative mt-6 flex items-end justify-between gap-4">
          <div className="grid flex-1 grid-cols-3 gap-2">
            {[
              { label: "إنجاز الأسبوع", value: `${data.stats.completionRate}%` },
              { label: "التزام الحضور", value: `${data.stats.attendanceRate}%` },
              { label: "اقتراحات حيّة", value: `${data.stats.proposals}` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_60%,transparent)] px-3 py-2">
                <div className="num text-base font-semibold">{item.value}</div>
                <div className="mt-0.5 text-[0.55rem] text-muted">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="relative hidden size-28 shrink-0 sm:block">
            <span className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-primary/25" />
            <span className="absolute inset-4 rounded-full border border-primary-2/20" />
            <div className="absolute inset-0 grid place-items-center">
              <ProgressRing value={data.stats.completionRate} size={92} stroke={5}>
                <div className="text-center">
                  <CountUp value={data.stats.completionRate} suffix="%" className="text-lg font-semibold" />
                  <div className="text-[0.45rem] text-muted">إنجاز</div>
                </div>
              </ProgressRing>
            </div>
          </div>
        </div>
      </SpotlightCard>
    ),

    kpis: (
      <div className="grid h-full grid-cols-2 gap-3">
        {kpis.map((kpi) => (
          <SpotlightCard key={kpi.label} className="flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              <span
                className="grid size-7 place-items-center rounded-lg"
                style={{ background: `color-mix(in oklab, ${kpi.color} 16%, transparent)`, color: kpi.color }}
              >
                <kpi.icon className="size-3.5" />
              </span>
              <Delta value={kpi.delta} />
            </div>
            <div className="mt-3">
              <CountUp value={kpi.value} suffix={kpi.suffix} className="text-2xl font-semibold text-fg" />
              <div className="mt-0.5 text-[0.6rem] text-muted">{kpi.label}</div>
            </div>
            <div className="mt-2 opacity-70">
              <Sparkline data={kpi.spark} color={kpi.color} width={110} height={26} />
            </div>
          </SpotlightCard>
        ))}
      </div>
    ),

    velocity: (
      <WidgetCard
        title="إيقاع العمل"
        kicker="VELOCITY · 8 WEEKS"
        icon={Activity}
        action={
          <span className="chip text-[0.58rem]">
            <span className="live-dot" /> يتحدث تلقائياً
          </span>
        }
        className="min-h-[260px]"
      >
        <div className="h-[190px] w-full">
          <VelocityChart data={data.trends.velocity} />
        </div>
      </WidgetCard>
    ),

    workload: (
      <WidgetCard title="توزيع الحمل" kicker="WORKLOAD" icon={Timer} className="min-h-[260px]">
        <div className="h-[190px]">
          <WorkloadChart data={data.trends.workload} />
        </div>
      </WidgetCard>
    ),

    myTasks: (
      <WidgetCard
        title="مهامي اليوم"
        kicker="MY FOCUS"
        icon={CheckCircle2}
        action={
          <Link href="/tasks" className="text-[0.62rem] text-primary-soft hover:underline">
            الكل
          </Link>
        }
        bodyClassName="space-y-1.5"
      >
        {data.myTasks.length === 0 ? (
          <div className="grid h-full place-items-center py-8 text-center">
            <div>
              <CheckCircle2 className="mx-auto mb-2 size-8 text-success/70" />
              <p className="text-xs text-muted">لا مهام مفتوحة — يومك نظيف ✨</p>
            </div>
          </div>
        ) : (
          data.myTasks.slice(0, 5).map((task) => (
            <div
              key={task.id}
              className="group flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-2 transition hover:border-line hover:bg-[color-mix(in_oklab,var(--fg)_3%,transparent)]"
            >
              <button
                type="button"
                onClick={() => completeTask(task)}
                disabled={pendingTask === task.id}
                className="grid size-5 shrink-0 place-items-center rounded-full border border-line-strong text-transparent transition hover:border-success hover:text-success"
                aria-label={`إنجاز ${task.title}`}
              >
                <CheckCircle2 className="size-3.5" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.72rem] font-medium">{task.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[0.55rem] text-muted">
                  <span className="mono">{task.project?.code ?? "عام"}</span>
                  <span>·</span>
                  <span className={cn(isOverdue(task.dueDate) && "text-danger")}>{deadlineLabel(task.dueDate)}</span>
                  {task.subtasks.length > 0 ? (
                    <>
                      <span>·</span>
                      <span className="num">
                        {task.doneSubtasks}/{task.subtasks.length}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
              <span
                className="size-1.5 shrink-0 rounded-full"
                style={{
                  background:
                    task.priority === "CRITICAL"
                      ? "var(--danger)"
                      : task.priority === "HIGH"
                        ? "#FB923C"
                        : task.priority === "MEDIUM"
                          ? "var(--warning)"
                          : "var(--info)",
                }}
              />
            </div>
          ))
        )}
      </WidgetCard>
    ),

    activity: (
      <WidgetCard title="نبض اللجنة" kicker="ACTIVITY FEED" icon={Activity} bodyClassName="space-y-3">
        {data.activity.slice(0, 5).map((item) => {
          const Icon = ACTION_ICON[item.action] ?? Activity;
          return (
            <div key={item.id} className="flex gap-2.5">
              <div className="relative flex flex-col items-center">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-line bg-[var(--surface-2)] text-muted">
                  <Icon className="size-3" />
                </span>
                <span className="mt-1 w-px flex-1 bg-line" />
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-[0.68rem] leading-relaxed text-fg/90">
                  <span className="font-medium text-fg">{item.actor?.name.split(" ")[0] ?? "النظام"}</span>{" "}
                  <span className="text-muted">{item.summary}</span>
                </p>
                <span className="mono mt-1 block text-[0.52rem] text-muted/70">{relativeTime(item.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </WidgetCard>
    ),

    deadlines: (
      <WidgetCard title="أقرب المواعيد" kicker="DEADLINES" icon={CalendarClock} bodyClassName="space-y-2.5">
        {data.upcomingDeadlines.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">لا مواعيد قريبة</p>
        ) : (
          data.upcomingDeadlines.slice(0, 4).map((task) => {
            const days = task.dueDate ? Math.max(0, Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / 86_400_000)) : 0;
            return (
              <div key={task.id} className="flex items-center gap-2.5">
                <ProgressRing
                  value={Math.max(8, 100 - days * 14)}
                  size={34}
                  stroke={3}
                  color={days <= 1 ? "var(--danger)" : days <= 3 ? "var(--warning)" : "var(--primary-2)"}
                >
                  <span className="num text-[0.55rem]">{days}</span>
                </ProgressRing>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[0.68rem] font-medium">{task.title}</div>
                  <div className="text-[0.52rem] text-muted">{task.project?.name ?? "مهمة عامة"}</div>
                </div>
              </div>
            );
          })
        )}
      </WidgetCard>
    ),

    projects: (
      <WidgetCard
        title="مشاريعي النشطة"
        kicker="ACTIVE PROJECTS"
        icon={Layers}
        action={
          <Link href="/projects" className="text-[0.62rem] text-primary-soft hover:underline">
            الكل
          </Link>
        }
        bodyClassName="space-y-3"
      >
        {data.activeProjects.slice(0, 3).map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="group block rounded-xl border border-line/70 p-3 transition hover:border-[color-mix(in_oklab,var(--primary)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="size-2 shrink-0 rounded-full" style={{ background: project.color, boxShadow: `0 0 10px ${project.color}` }} />
                <span className="truncate text-[0.72rem] font-medium">{project.name}</span>
              </div>
              <span className="num text-[0.65rem] text-muted">{project.progress}%</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={project.progress} color={project.color} className="flex-1" />
              <span className="text-[0.52rem] text-muted">
                {project.taskDone}/{project.taskTotal} مهمة
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <AvatarGroup people={project.members} max={4} size="xs" />
              <span className={cn("text-[0.55rem]", project.daysLeft < 7 ? "text-danger" : "text-muted")}>
                {project.daysLeft < 0 ? `متأخر ${Math.abs(project.daysLeft)} يوم` : `متبقٍ ${project.daysLeft} يوم`}
              </span>
            </div>
          </Link>
        ))}
      </WidgetCard>
    ),

    team: (
      <WidgetCard title="نبض الفريق" kicker="TEAM PULSE" icon={Users} bodyClassName="space-y-2.5">
        {data.teamPulse.map((row) => (
          <div key={row.member.id} className="flex items-center gap-2.5">
            <Avatar name={row.member.name} hue={row.member.avatarHue} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[0.68rem]">{row.member.name}</span>
                <span className="num text-[0.55rem] text-muted">{row.tasks} مهمة</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--fg)_7%,transparent)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${row.load}%`,
                    background:
                      row.load > 75
                        ? "linear-gradient(90deg,#fb7185,#ffb86b)"
                        : "linear-gradient(90deg,var(--primary),var(--primary-2))",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </WidgetCard>
    ),

    leaderboard: (
      <WidgetCard
        title="صدارة الشهر"
        kicker="LEADERBOARD"
        icon={Trophy}
        action={
          <Link href="/achievements" className="text-[0.62rem] text-primary-soft hover:underline">
            الكل
          </Link>
        }
        bodyClassName="space-y-2"
      >
        {data.leaderboard.slice(0, 5).map((row) => (
          <div key={row.member.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-lg text-[0.6rem] font-bold",
                row.rank === 1 && "bg-[#F5C451]/15 text-[#F5C451]",
                row.rank === 2 && "bg-[#CBD5E1]/15 text-[#CBD5E1]",
                row.rank === 3 && "bg-[#D97706]/15 text-[#D97706]",
                row.rank > 3 && "bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] text-muted",
              )}
            >
              {row.rank}
            </span>
            <Avatar name={row.member.name} hue={row.member.avatarHue} size="xs" ring={row.member.role.color} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[0.68rem]">{row.member.name}</div>
              <div className="text-[0.52rem]" style={{ color: row.member.role.color }}>
                {row.member.role.name}
              </div>
            </div>
            <div className="text-end">
              <div className="num text-[0.68rem] font-semibold">{row.points.toLocaleString("en-US")}</div>
              <div className="text-[0.48rem] text-muted">نقطة</div>
            </div>
          </div>
        ))}
      </WidgetCard>
    ),

    proposals: (
      <WidgetCard
        title="أفضل الأفكار"
        kicker="TOP IDEAS"
        icon={Sparkles}
        action={
          <Link href="/proposals" className="text-[0.62rem] text-primary-soft hover:underline">
            الكل
          </Link>
        }
        bodyClassName="space-y-2.5"
      >
        {data.topProposals.map((proposal) => (
          <Link
            key={proposal.id}
            href="/proposals"
            className="block rounded-xl border border-line/70 p-2.5 transition hover:border-[color-mix(in_oklab,var(--primary)_40%,transparent)]"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-[0.68rem] font-medium leading-relaxed">{proposal.title}</p>
              <span className="num shrink-0 rounded-md bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] px-1.5 py-0.5 text-[0.6rem] text-primary-soft">
                {proposal.score}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[0.52rem] text-muted">
              <span>{proposal.category}</span>
              <span>·</span>
              <span>▲ {proposal.upvotes}</span>
              <span>▼ {proposal.downvotes}</span>
            </div>
          </Link>
        ))}
      </WidgetCard>
    ),

    meetings: (
      <WidgetCard title="الاجتماعات القادمة" kicker="UPCOMING" icon={CalendarClock} bodyClassName="space-y-2.5">
        {data.upcomingMeetings.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted">لا اجتماعات قادمة</p>
        ) : (
          data.upcomingMeetings.map((meeting) => (
            <Link key={meeting.id} href="/meetings" className="flex gap-2.5 rounded-xl border border-line/60 p-2.5 transition hover:border-primary/30">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-center">
                <span className="num text-[0.8rem] font-semibold">{new Date(meeting.startsAt).getDate()}</span>
                <span className="text-[0.42rem] text-muted">{formatDate(meeting.startsAt).split(" ")[1]}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-[0.68rem] font-medium">{meeting.title}</div>
                <div className="mt-0.5 text-[0.52rem] text-muted">
                  {formatTime(meeting.startsAt)} · {meeting.location.split("—")[0]}
                </div>
              </div>
            </Link>
          ))
        )}
      </WidgetCard>
    ),
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="COMMAND CENTER · 01"
        title="مركز القيادة"
        description="صورة حيّة لأداء اللجنة: المشاريع، المهام، الأفكار، والناس خلفها."
        actions={
          <>
            <Button variant={editing ? "soft" : "ghost"} size="sm" onClick={() => setEditing((current) => !current)}>
              <Palette className="size-3.5" />
              {editing ? "إنهاء التخصيص" : "تخصيص اللوحة"}
            </Button>
            {editing ? (
              <Button variant="ghost" size="sm" onClick={resetOrder}>
                <RotateCcw className="size-3.5" />
                إعادة الترتيب
              </Button>
            ) : null}
            <Link href="/tasks" className="btn btn-primary btn-shimmer h-9 text-xs">
              <Plus className="size-3.5" />
              مهمة جديدة
            </Link>
          </>
        }
      />

      {editing ? (
        <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] px-3 py-2 text-[0.65rem] text-primary-soft">
          <GripVertical className="size-3.5" />
          اسحب أي ودجت من المقبض لإعادة ترتيب لوحتك — يُحفظ الترتيب تلقائياً.
        </div>
      ) : null}

      <DndContext id="dashboard-grid" sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-12 gap-3.5">
            {order.map((id) => (
              <SortableWidget key={id} id={id} editing={editing}>
                {widgets[id]}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-2 text-[0.6rem] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="live-dot" />
          آخر تحديث {relativeTime(new Date().toISOString())} · البيانات الحالية
        </span>
        <span className="mono">TECTNAL OS · v1.1</span>
      </div>
    </div>
  );
}

