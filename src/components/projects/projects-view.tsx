"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarRange,
  Check,
  Columns3,
  GanttChartSquare,
  Grid2X2,
  LayoutList,
  Plus,
  Search,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import type { MemberLite, ProjectView } from "@/lib/types";
import {
  PROJECT_STATUS_META,
  PRIORITY_META,
  cn,
  formatCurrency,
  formatDate,
} from "@/lib/utils";
import { createProject } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";

type ViewMode = "grid" | "kanban" | "timeline" | "table";

const VIEWS: { key: ViewMode; label: string; icon: typeof Grid2X2 }[] = [
  { key: "grid", label: "شبكة", icon: Grid2X2 },
  { key: "kanban", label: "كانبان", icon: Columns3 },
  { key: "timeline", label: "جدول زمني", icon: GanttChartSquare },
  { key: "table", label: "قائمة", icon: LayoutList },
];

const STATUS_ORDER = ["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"];

export function ProjectsView({
  projects,
  members,
  canCreate,
  canSeeBudget,
}: {
  projects: ProjectView[];
  members: MemberLite[];
  canCreate: boolean;
  canSeeBudget: boolean;
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      if (status !== "ALL" && project.status !== status) return false;
      if (priority !== "ALL" && project.priority !== priority) return false;
      if (!normalized) return true;
      return (
        project.name.toLowerCase().includes(normalized) ||
        project.code.toLowerCase().includes(normalized) ||
        project.tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    });
  }, [projects, query, status, priority]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === "ACTIVE").length,
      budget: projects.reduce((sum, project) => sum + project.budget, 0),
      avg: projects.length === 0 ? 0 : Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length),
    }),
    [projects],
  );

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProject({
          name: String(formData.get("name") ?? ""),
          description: String(formData.get("description") ?? ""),
          priority: String(formData.get("priority") ?? "MEDIUM") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          dueDate: String(formData.get("dueDate") ?? ""),
          budget: Number(formData.get("budget") ?? 0),
          tags: String(formData.get("tags") ?? ""),
          memberIds: selectedMembers,
        });
        toast.success("أُنشئ المشروع بنجاح");
        setOpen(false);
        setSelectedMembers([]);
        formRef.current?.reset();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إنشاء المشروع");
      }
    });
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="PROJECTS · 02"
        title="المشاريع"
        description="كل مبادرة للجنة في مكان واحد: التقدم، الفريق، الميزانية، والمعالم."
        actions={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-shimmer">
                  <Plus className="size-3.5" />
                  مشروع جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[min(94vw,620px)]">
                <DialogHeader>
                  <DialogTitle>إنشاء مشروع جديد</DialogTitle>
                  <DialogDescription>ابدأ من الصفر أو استخدم قالباً جاهزاً — يمكنك تعديل كل شيء لاحقاً.</DialogDescription>
                </DialogHeader>
                <form
                  ref={formRef}
                  action={submit}
                  className="space-y-3.5"
                >
                  <Field label="اسم المشروع">
                    <Input name="name" required minLength={4} placeholder="مثال: منصة إدارة الفعاليات" />
                  </Field>
                  <Field label="الوصف">
                    <Textarea name="description" required minLength={20} placeholder="ما الهدف؟ وما النطاق؟" />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="الأولوية">
                      <Select name="priority" defaultValue="MEDIUM">
                        {Object.entries(PRIORITY_META).map(([key, meta]) => (
                          <option key={key} value={key}>
                            {meta.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="تاريخ الاستحقاق">
                      <Input name="dueDate" type="date" required />
                    </Field>
                    <Field label="الميزانية (ر.س)">
                      <Input name="budget" type="number" min={0} step={1000} defaultValue={0} />
                    </Field>
                  </div>
                  <Field label="الوسوم" hint="افصل بينها بفاصلة">
                    <Input name="tags" placeholder="Next.js، تجربة مستخدم، تكامل" />
                  </Field>
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-muted">فريق المشروع</span>
                    <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto rounded-xl border border-line p-2">
                      {members.map((member) => {
                        const checked = selectedMembers.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() =>
                              setSelectedMembers((current) =>
                                current.includes(member.id)
                                  ? current.filter((id) => id !== member.id)
                                  : [...current, member.id],
                              )
                            }
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2 py-1.5 text-start text-[0.68rem] transition",
                              checked ? "bg-[color-mix(in_oklab,var(--primary)_16%,transparent)]" : "hover:bg-white/5",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-4 shrink-0 place-items-center rounded border",
                                checked ? "border-primary bg-primary text-white" : "border-line",
                              )}
                            >
                              {checked ? <Check className="size-3" /> : null}
                            </span>
                            <Avatar name={member.name} hue={member.avatarHue} size="xs" />
                            <span className="truncate">{member.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" size="sm" loading={pending}>
                      إنشاء المشروع
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "إجمالي المشاريع", value: stats.total, icon: GanttChartSquare, color: "#A78BFA" },
          { label: "مشاريع نشطة", value: stats.active, icon: Columns3, color: "#22D3EE" },
          { label: "متوسط الإنجاز", value: `${stats.avg}%`, icon: CalendarRange, color: "#34D399" },
          ...(canSeeBudget ? [{ label: "الميزانية الكلية", value: formatCurrency(stats.budget), icon: Wallet, color: "#FFB86B" }] : []),
        ].map((stat) => (
          <div key={stat.label} className="glass flex items-center gap-3 rounded-xl p-3.5">
            <span
              className="grid size-9 place-items-center rounded-xl"
              style={{ background: `color-mix(in oklab, ${stat.color} 14%, transparent)`, color: stat.color }}
            >
              <stat.icon className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="num truncate text-base font-semibold">{stat.value}</div>
              <div className="truncate text-[0.58rem] text-muted">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-3.5 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم المشروع أو الرمز أو الوسم…"
            className="field h-9 ps-9 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="size-3.5 text-muted" />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="field h-9 w-auto py-0 text-xs">
            <option value="ALL">كل الحالات</option>
            {Object.entries(PROJECT_STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)} className="field h-9 w-auto py-0 text-xs">
            <option value="ALL">كل الأولويات</option>
            {Object.entries(PRIORITY_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex rounded-lg border border-line p-0.5">
          {VIEWS.map((item) => (
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
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {filtered.length === 0 ? (
            <div className="glass rounded-[var(--radius)] p-12 text-center text-sm text-muted">
              لا مشاريع مطابقة للفلاتر الحالية.
            </div>
          ) : view === "grid" ? (
            <GridProjects projects={filtered} canSeeBudget={canSeeBudget} />
          ) : view === "kanban" ? (
            <KanbanProjects projects={filtered} />
          ) : view === "timeline" ? (
            <TimelineProjects projects={filtered} />
          ) : (
            <TableProjects projects={filtered} canSeeBudget={canSeeBudget} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function GridProjects({ projects, canSeeBudget }: { projects: ProjectView[]; canSeeBudget: boolean }) {
  return (
    <Stagger className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <StaggerItem key={project.id}>
          <SpotlightCard className="group h-full p-0">
            <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="mono text-[0.55rem] text-muted">{project.code}</div>
                  <Link href={`/projects/${project.id}`} className="mt-1 block truncate font-display text-sm font-semibold hover:text-primary-soft">
                    {project.name}
                  </Link>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <p className="mt-2 line-clamp-2 min-h-8 text-[0.65rem] leading-relaxed text-muted">{project.description}</p>

              <div className="mt-3 flex flex-wrap gap-1">
                {project.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="chip text-[0.52rem]">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-[0.6rem]">
                  <span className="text-muted">الإنجاز</span>
                  <span className="num font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} color={project.color} />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <AvatarGroup people={project.members} max={4} size="xs" />
                <div className="flex items-center gap-1.5">
                  <PriorityBadge priority={project.priority} className="text-[0.5rem]" />
                  <Badge className={cn("text-[0.5rem]", project.daysLeft < 7 && "text-danger")}>
                    {project.daysLeft < 0 ? `متأخر ${Math.abs(project.daysLeft)}ي` : `${project.daysLeft} يوم`}
                  </Badge>
                </div>
              </div>

              {canSeeBudget ? (
                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[0.55rem] text-muted">
                  <span className="flex items-center gap-1">
                    <Wallet className="size-3" />
                    {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                  </span>
                  <Link href={`/projects/${project.id}`} className="flex items-center gap-0.5 text-primary-soft opacity-0 transition group-hover:opacity-100">
                    تفاصيل <ArrowUpRight className="size-3" />
                  </Link>
                </div>
              ) : null}
            </div>
          </SpotlightCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

function KanbanProjects({ projects }: { projects: ProjectView[] }) {
  return (
    <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-2 xl:grid-cols-4">
      {["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED"].map((status) => {
        const meta = PROJECT_STATUS_META[status];
        const list = projects.filter((project) => project.status === status);
        return (
          <div key={status} className="rounded-2xl border border-line bg-[color-mix(in_oklab,var(--surface)_55%,transparent)] p-2.5">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-[0.68rem] font-medium" style={{ color: meta.color }}>
                <span className="size-1.5 rounded-full" style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }} />
                {meta.label}
              </span>
              <span className="num text-[0.55rem] text-muted">{list.length}</span>
            </div>
            <div className="space-y-2">
              {list.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_80%,transparent)] p-3 transition hover:border-[color-mix(in_oklab,var(--primary)_40%,transparent)]"
                >
                  <div className="mono text-[0.5rem] text-muted">{project.code}</div>
                  <div className="mt-1 line-clamp-2 text-[0.7rem] font-medium">{project.name}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <AvatarGroup people={project.members} max={3} size="xs" />
                    <span className="num text-[0.58rem] text-muted">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} color={project.color} className="mt-2 h-1" />
                </Link>
              ))}
              {list.length === 0 ? <p className="px-1 py-6 text-center text-[0.6rem] text-muted/60">لا مشاريع</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineProjects({ projects }: { projects: ProjectView[] }) {
  const dates = projects.flatMap((project) => [new Date(project.startDate).getTime(), new Date(project.dueDate).getTime()]);
  const min = Math.min(...dates);
  const max = Math.max(...dates);
  const span = max - min || 1;
  const today = ((Date.now() - min) / span) * 100;

  return (
    <div className="glass overflow-hidden rounded-[var(--radius)] p-4">
      <div className="mb-3 flex items-center justify-between text-[0.6rem] text-muted">
        <span>الجدول الزمني للمشاريع</span>
        <span className="mono">
          {formatDate(new Date(min))} — {formatDate(new Date(max))}
        </span>
      </div>
      <div className="relative space-y-2.5">
        <div className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary-2/50" style={{ insetInlineStart: `${Math.min(98, Math.max(0, today))}%` }}>
          <span className="absolute -top-1 size-1.5 -translate-x-1/2 rounded-full bg-primary-2" />
        </div>
        {projects.map((project) => {
          const start = ((new Date(project.startDate).getTime() - min) / span) * 100;
          const end = ((new Date(project.dueDate).getTime() - min) / span) * 100;
          return (
            <Link key={project.id} href={`/projects/${project.id}`} className="block">
              <div className="mb-1 flex justify-between text-[0.58rem]">
                <span className="truncate">{project.name}</span>
                <span className="mono text-muted">{project.progress}%</span>
              </div>
              <div className="relative h-7 rounded-lg bg-[color-mix(in_oklab,var(--fg)_5%,transparent)]">
                <div
                  className="absolute inset-y-1 rounded-md px-2 text-[0.5rem] leading-5 text-white/90"
                  style={{
                    insetInlineStart: `${start}%`,
                    width: `${Math.max(6, end - start)}%`,
                    background: `linear-gradient(90deg, ${project.color}, color-mix(in oklab, ${project.color} 55%, transparent))`,
                    boxShadow: `0 0 16px -4px ${project.color}`,
                  }}
                >
                  <span className="mono">{project.code}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TableProjects({ projects, canSeeBudget }: { projects: ProjectView[]; canSeeBudget: boolean }) {
  return (
    <div className="glass overflow-x-auto rounded-[var(--radius)] p-2">
      <table className="data-table">
        <thead>
          <tr>
            <th>المشروع</th>
            <th>الحالة</th>
            <th>الأولوية</th>
            <th>التقدم</th>
            <th>الفريق</th>
            <th>الاستحقاق</th>
            {canSeeBudget ? <th>الميزانية</th> : null}
            <th />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: project.color }} />
                  <div>
                    <div className="text-[0.72rem] font-medium">{project.name}</div>
                    <div className="mono text-[0.5rem] text-muted">{project.code}</div>
                  </div>
                </div>
              </td>
              <td><StatusBadge status={project.status} /></td>
              <td><PriorityBadge priority={project.priority} /></td>
              <td>
                <div className="flex w-28 items-center gap-2">
                  <Progress value={project.progress} color={project.color} className="h-1.5" />
                  <span className="num text-[0.55rem] text-muted">{project.progress}%</span>
                </div>
              </td>
              <td><AvatarGroup people={project.members} max={3} size="xs" /></td>
              <td className={cn("text-[0.65rem]", project.daysLeft < 7 && "text-danger")}>{formatDate(project.dueDate)}</td>
              {canSeeBudget ? <td className="mono text-[0.6rem]">{formatCurrency(project.budget)}</td> : null}
              <td>
                <Link href={`/projects/${project.id}`} className="text-[0.62rem] text-primary-soft hover:underline">
                  عرض
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
