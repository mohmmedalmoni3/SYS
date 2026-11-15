"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  ListFilter,
  Play,
  Plus,
  Search,
  Square,
  Timer,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { MemberLite, TaskStatus, TaskView } from "@/lib/types";
import {
  PRIORITY_META,
  TASK_STATUS_META,
  cn,
  deadlineLabel,
  formatDate,
  formatTime,
  isOverdue,
} from "@/lib/utils";
import { createTask, logTime, moveTask, toggleSubtask } from "@/server/actions";
import { useTimeTracker } from "@/hooks/use-time-tracker";
import { Button } from "@/components/ui/button";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SectionHeader } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { SpotlightCard } from "@/components/fx/spotlight-card";

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: "BACKLOG", label: "الأفكار", color: "#94A3B8" },
  { key: "TODO", label: "قائمة الانتظار", color: "#60A5FA" },
  { key: "IN_PROGRESS", label: "قيد التنفيذ", color: "#22D3EE" },
  { key: "REVIEW", label: "مراجعة", color: "#A78BFA" },
  { key: "DONE", label: "مكتمل", color: "#34D399" },
];

interface TaskCardData {
  task: TaskView;
  onOpen: (task: TaskView) => void;
  overlay?: boolean;
}

function TaskCard({ task, onOpen, overlay = false }: TaskCardData) {
  return (
    <div
      onClick={() => onOpen(task)}
      className={cn(
        "group cursor-pointer rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_82%,transparent)] p-3 transition hover:border-[color-mix(in_oklab,var(--primary)_45%,transparent)] hover:shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--primary)_70%,transparent)]",
        overlay && "rotate-2 scale-[1.02] shadow-2xl",
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(task);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <PriorityBadge priority={task.priority} className="text-[0.48rem]" />
          {task.recurrence !== "none" ? <Badge className="text-[0.46rem]">متكررة</Badge> : null}
        </div>
        {task.project ? (
          <span className="mono shrink-0 text-[0.48rem] text-muted">{task.project.code}</span>
        ) : null}
      </div>

      <h4 className="mt-2 line-clamp-2 text-[0.72rem] font-medium leading-relaxed">{task.title}</h4>

      {task.labels.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {task.labels.slice(0, 2).map((label) => (
            <span key={label} className="rounded bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] px-1.5 py-0.5 text-[0.46rem] text-muted">
              {label}
            </span>
          ))}
        </div>
      ) : null}

      {task.subtasks.length > 0 ? (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[0.48rem] text-muted">
            <span>
              {task.doneSubtasks}/{task.subtasks.length} خطوة
            </span>
            <span className="num">{Math.round((task.doneSubtasks / task.subtasks.length) * 100)}%</span>
          </div>
          <Progress value={(task.doneSubtasks / task.subtasks.length) * 100} className="mt-1 h-1" />
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <Avatar name={task.assignee.name} hue={task.assignee.avatarHue} size="xs" ring={task.assignee.role.color} />
          ) : (
            <span className="grid size-5 place-items-center rounded-full border border-dashed border-line text-[0.5rem] text-muted">?</span>
          )}
          {task.dueDate ? (
            <span className={cn("text-[0.5rem]", isOverdue(task.dueDate) && task.status !== "DONE" && "text-danger")}>
              {deadlineLabel(task.dueDate)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 text-[0.48rem] text-muted">
          {task.timeSpent > 0 ? (
            <span className="num flex items-center gap-0.5">
              <Timer className="size-2.5" />
              {Math.floor(task.timeSpent / 60)}س
            </span>
          ) : null}
          {task.commentsCount > 0 ? <span className="num">{task.commentsCount}💬</span> : null}
        </div>
      </div>
    </div>
  );
}

function SortableTask({ task, onOpen }: { task: TaskView; onOpen: (task: TaskView) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </div>
  );
}

function Column({
  status,
  label,
  color,
  tasks,
  onOpen,
}: {
  status: TaskStatus;
  label: string;
  color: string;
  tasks: TaskView[];
  onOpen: (task: TaskView) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex min-h-[420px] flex-1 flex-col rounded-2xl border border-line bg-[color-mix(in_oklab,var(--surface)_45%,transparent)] p-2.5">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-[0.68rem] font-medium" style={{ color }}>
          <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
          {label}
        </span>
        <span className="num rounded-md bg-[color-mix(in_oklab,var(--fg)_6%,transparent)] px-1.5 text-[0.52rem] text-muted">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 rounded-xl transition",
          isOver && "bg-[color-mix(in_oklab,var(--primary)_8%,transparent)] ring-1 ring-primary/30",
        )}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onOpen={onOpen} />
          ))}
        </SortableContext>
        {tasks.length === 0 ? (
          <div className="grid h-24 place-items-center rounded-xl border border-dashed border-line text-[0.58rem] text-muted/60">
            أفلت مهمة هنا
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TaskDialog({
  task,
  onClose,
  canEdit,
}: {
  task: TaskView;
  onClose: () => void;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const timer = useTimeTracker(task.id);
  const [subtasks, setSubtasks] = useState(task.subtasks);

  function toggleSub(subtaskId: string, done: boolean) {
    setSubtasks((current) => current.map((subtask) => (subtask.id === subtaskId ? { ...subtask, done } : subtask)));
    startTransition(async () => {
      try {
        await toggleSubtask(subtaskId, done);
        router.refresh();
      } catch {
        setSubtasks(task.subtasks);
        toast.error("تعذّر تحديث الخطوة");
      }
    });
  }

  function finishTimer() {
    const minutes = timer.stop();
    startTransition(async () => {
      try {
        await logTime(task.id, minutes, "جلسة عمل من مؤقّت المهمة");
        toast.success(`سُجّلت ${minutes} دقيقة`);
        router.refresh();
      } catch {
        toast.error("تعذّر تسجيل الوقت");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(94vw,620px)]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {task.project ? (
              <Link href={`/projects/${task.project.id}`} className="mono text-[0.58rem] text-primary-soft hover:underline">
                {task.project.code}
              </Link>
            ) : null}
          </div>
          <DialogTitle className="mt-1 leading-relaxed">{task.title}</DialogTitle>
          <DialogDescription>{task.description || "لا وصف لهذه المهمة."}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 text-[0.62rem] sm:grid-cols-4">
          {[
            { label: "المسؤول", value: task.assignee?.name ?? "غير مسندة" },
            { label: "الاستحقاق", value: task.dueDate ? formatDate(task.dueDate) : "بلا موعد" },
            { label: "التقدير", value: task.estimate ? `${Math.round(task.estimate / 60)} ساعة` : "—" },
            { label: "الوقت المسجل", value: `${Math.floor((task.timeSpent + (timer.running ? timer.seconds / 60 : 0)) / 60)} س ${(task.timeSpent + (timer.running ? timer.seconds / 60 : 0)) % 60} د` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-line px-2 py-1.5">
              <div className="text-[0.5rem] text-muted">{item.label}</div>
              <div className="mt-0.5 truncate text-[0.65rem] font-medium">{item.value}</div>
            </div>
          ))}
        </div>

        {subtasks.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-[0.62rem] text-muted">
              <span>المهام الفرعية</span>
              <span className="num">
                {subtasks.filter((subtask) => subtask.done).length}/{subtasks.length}
              </span>
            </div>
            {subtasks.map((subtask) => (
              <button
                key={subtask.id}
                type="button"
                disabled={!canEdit}
                onClick={() => toggleSub(subtask.id, !subtask.done)}
                className="flex w-full items-center gap-2 rounded-lg border border-line/60 px-2 py-1.5 text-start text-[0.66rem] transition hover:bg-white/5"
              >
                <span
                  className={cn(
                    "grid size-4 shrink-0 place-items-center rounded border",
                    subtask.done ? "border-success bg-success/20 text-success" : "border-line",
                  )}
                >
                  {subtask.done ? <CheckCircle2 className="size-3" /> : null}
                </span>
                <span className={cn("flex-1", subtask.done && "text-muted line-through")}>{subtask.title}</span>
              </button>
            ))}
          </div>
        ) : null}

        {task.dependencies.length > 0 ? (
          <div className="mt-3 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2">
            <div className="text-[0.55rem] text-warning">تعتمد على</div>
            {task.dependencies.map((dependency) => (
              <div key={dependency.id} className="mt-1 flex items-center justify-between text-[0.62rem]">
                <span className="truncate">{dependency.title}</span>
                <StatusBadge status={dependency.status} />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_60%,transparent)] p-3">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-primary-soft" />
            <div>
              <div className="text-[0.55rem] text-muted">مؤقّت العمل</div>
              <div className="num text-sm font-semibold">{timer.label}</div>
            </div>
          </div>
          <div className="flex gap-2">
            {timer.running ? (
              <Button size="sm" variant="danger" onClick={finishTimer} loading={pending}>
                <Square className="size-3" /> إيقاف وحفظ
              </Button>
            ) : (
              <Button size="sm" variant="success" onClick={timer.start} disabled={!canEdit}>
                <Play className="size-3" /> ابدأ المؤقّت
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => { timer.reset(); toast.success("أُعيد ضبط المؤقّت"); }}>
              تصفير
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[0.55rem] text-muted">
          <span>أنشأها {task.creator?.name ?? "—"}</span>
          <span className="mono">{formatTime(task.createdAt)}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TasksView({
  initialTasks,
  projects,
  members,
  currentUserId,
  canCreate,
}: {
  initialTasks: TaskView[];
  projects: { id: string; name: string; code: string }[];
  members: MemberLite[];
  currentUserId: string;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<TaskView | null>(null);
  const [dragged, setDragged] = useState<TaskView | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [myOnly, setMyOnly] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (myOnly && task.assignee?.id !== currentUserId) return false;
      if (projectFilter !== "ALL" && task.project?.id !== projectFilter) return false;
      if (assigneeFilter !== "ALL" && task.assignee?.id !== assigneeFilter) return false;
      if (priorityFilter !== "ALL" && task.priority !== priorityFilter) return false;
      if (!normalized) return true;
      return task.title.toLowerCase().includes(normalized) || task.labels.some((label) => label.includes(normalized));
    });
  }, [tasks, query, projectFilter, assigneeFilter, priorityFilter, myOnly, currentUserId]);

  function onDragStart(event: DragStartEvent) {
    const task = tasks.find((candidate) => candidate.id === event.active.id);
    setDragged(task ?? null);
  }

  function onDragEnd(event: DragEndEvent) {
    setDragged(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const source = tasks.find((task) => task.id === activeId);
    if (!source) return;

    const targetColumn = COLUMNS.find((column) => column.key === overId)?.key;
    const targetTask = tasks.find((task) => task.id === overId);
    const targetStatus = targetColumn ?? targetTask?.status;
    if (!targetStatus) return;

    if (source.status === targetStatus) return;

    setTasks((current) =>
      current.map((task) => (task.id === activeId ? { ...task, status: targetStatus } : task)),
    );

    startTransition(async () => {
      try {
        await moveTask(activeId, targetStatus);
        if (targetStatus === "DONE") toast.success("أُنجزت المهمة · +10 نقاط");
        router.refresh();
      } catch (error) {
        setTasks((current) => current.map((task) => (task.id === activeId ? { ...task, status: source.status } : task)));
        toast.error(error instanceof Error ? error.message : "تعذّر نقل المهمة");
      }
    });
  }

  function submitTask(formData: FormData) {
    startTransition(async () => {
      try {
        await createTask({
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          projectId: String(formData.get("projectId") ?? "") || null,
          assigneeId: String(formData.get("assigneeId") ?? "") || null,
          status: String(formData.get("status") ?? "TODO") as TaskStatus,
          priority: String(formData.get("priority") ?? "MEDIUM") as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
          dueDate: String(formData.get("dueDate") ?? "") || null,
          estimate: Number(formData.get("estimate") ?? 0),
        });
        toast.success("أُضيفت المهمة");
        setOpenCreate(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إنشاء المهمة");
      }
    });
  }

  const myTasks = useMemo(() => tasks.filter((task) => task.assignee?.id === currentUserId), [tasks, currentUserId]);
  const groupedMy = useMemo(() => {
    const open = myTasks.filter((task) => task.status !== "DONE");
    return {
      overdue: open.filter((task) => isOverdue(task.dueDate)),
      today: open.filter((task) => task.dueDate && !isOverdue(task.dueDate) && task.dueDate.slice(0, 10) === new Date().toISOString().slice(0, 10)),
      week: open.filter((task) => task.dueDate && new Date(task.dueDate).getTime() - Date.now() < 7 * 86_400_000 && new Date(task.dueDate).getTime() > Date.now()),
      later: open.filter((task) => !task.dueDate || new Date(task.dueDate).getTime() - Date.now() >= 7 * 86_400_000),
    };
  }, [myTasks]);

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="TASKS · 03"
        title="المهام"
        description="لوحة تنفيذ حيّة: اسحب، أفلت، تابع الوقت، وأنجز."
        actions={
          <>
            <Button variant={myOnly ? "soft" : "ghost"} size="sm" onClick={() => setMyOnly((current) => !current)}>
              <Users className="size-3.5" />
              مهامي فقط
            </Button>
            {canCreate ? (
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <Button size="sm" className="btn-shimmer">
                    <Plus className="size-3.5" />
                    مهمة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[min(94vw,600px)]">
                  <DialogHeader>
                    <DialogTitle>مهمة جديدة</DialogTitle>
                    <DialogDescription>حدّد المسؤول والموعد — يمكنك إضافة مهام فرعية بعد الإنشاء.</DialogDescription>
                  </DialogHeader>
                  <form action={submitTask} className="space-y-3">
                    <Field label="عنوان المهمة">
                      <Input name="title" required minLength={4} placeholder="ماذا يجب أن يُنجز؟" />
                    </Field>
                    <Field label="الوصف">
                      <Textarea name="description" placeholder="تفاصيل، معايير قبول، ملاحظات…" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="المشروع">
                        <Select name="projectId" defaultValue="">
                          <option value="">بدون مشروع</option>
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="المسؤول">
                        <Select name="assigneeId" defaultValue={currentUserId}>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="الأولوية">
                        <Select name="priority" defaultValue="MEDIUM">
                          {Object.entries(PRIORITY_META).map(([key, meta]) => (
                            <option key={key} value={key}>
                              {meta.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="الحالة">
                        <Select name="status" defaultValue="TODO">
                          {COLUMNS.map((column) => (
                            <option key={column.key} value={column.key}>
                              {column.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="الاستحقاق">
                        <Input name="dueDate" type="date" />
                      </Field>
                      <Field label="التقدير (دقائق)">
                        <Input name="estimate" type="number" min={0} step={15} defaultValue={60} />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setOpenCreate(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" size="sm">
                        إضافة المهمة
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </>
        }
      />

      <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-2">
        <div className="relative min-w-44 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-3.5 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في المهام…" className="field h-9 ps-9 text-xs" />
        </div>
        <ListFilter className="size-3.5 text-muted" />
        <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="field h-9 w-auto py-0 text-xs">
          <option value="ALL">كل المشاريع</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.code}
            </option>
          ))}
        </select>
        <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="field h-9 w-auto py-0 text-xs">
          <option value="ALL">كل الأعضاء</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="field h-9 w-auto py-0 text-xs">
          <option value="ALL">كل الأولويات</option>
          {Object.entries(PRIORITY_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <span className="num ms-auto text-[0.58rem] text-muted">{filtered.length} مهمة</span>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">اللوحة</TabsTrigger>
          <TabsTrigger value="mine">مهامي ({myTasks.filter((task) => task.status !== "DONE").length})</TabsTrigger>
          <TabsTrigger value="calendar">التقويم</TabsTrigger>
        </TabsList>

        <TabsContent value="board">
          <DndContext id="tasks-board" sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="flex gap-2.5 overflow-x-auto pb-3">
              {COLUMNS.map((column) => (
                <div key={column.key} className="min-w-[210px] 2xl:min-w-[248px] flex-1">
                  <Column
                    status={column.key}
                    label={column.label}
                    color={column.color}
                    tasks={filtered.filter((task) => task.status === column.key)}
                    onOpen={setActiveTask}
                  />
                </div>
              ))}
            </div>
            <DragOverlay>
              {dragged ? <div className="w-64"><TaskCard task={dragged} onOpen={() => undefined} overlay /></div> : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        <TabsContent value="mine">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { title: "متأخرة", list: groupedMy.overdue, color: "#FB7185" },
              { title: "اليوم", list: groupedMy.today, color: "#FFB86B" },
              { title: "هذا الأسبوع", list: groupedMy.week, color: "#22D3EE" },
              { title: "لاحقاً", list: groupedMy.later, color: "#94A3B8" },
            ].map((group) => (
              <SpotlightCard key={group.title} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[0.7rem] font-medium" style={{ color: group.color }}>
                    <span className="size-1.5 rounded-full" style={{ background: group.color }} />
                    {group.title}
                  </span>
                  <span className="num text-[0.55rem] text-muted">{group.list.length}</span>
                </div>
                <div className="space-y-1.5">
                  {group.list.length === 0 ? (
                    <p className="py-3 text-[0.6rem] text-muted/60">لا مهام</p>
                  ) : (
                    group.list.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setActiveTask(task)}
                        className="flex w-full items-center gap-2 rounded-lg border border-line/60 px-2 py-1.5 text-start transition hover:border-primary/30"
                      >
                        <Circle className="size-3 text-muted" />
                        <span className="min-w-0 flex-1 truncate text-[0.65rem]">{task.title}</span>
                        <span className="mono text-[0.5rem] text-muted">{task.project?.code}</span>
                      </button>
                    ))
                  )}
                </div>
              </SpotlightCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <TaskCalendar tasks={filtered} onOpen={setActiveTask} />
        </TabsContent>
      </Tabs>

      {activeTask ? (
        <TaskDialog task={tasks.find((task) => task.id === activeTask.id) ?? activeTask} onClose={() => setActiveTask(null)} canEdit />
      ) : null}
    </div>
  );
}

function TaskCalendar({ tasks, onOpen }: { tasks: TaskView[]; onOpen: (task: TaskView) => void }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const days = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let index = 0; index < firstDay; index += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    return cells;
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskView[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);

  return (
    <SpotlightCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">
          {month.toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="الشهر السابق">
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="الشهر التالي">
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"].map((day) => (
          <div key={day} className="pb-1 text-center text-[0.55rem] text-muted">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayTasks = tasksByDay.get(key) ?? [];
          const isToday = new Date().toDateString() === new Date(month.getFullYear(), month.getMonth(), day).toDateString();
          return (
            <div
              key={key}
              className={cn(
                "min-h-20 rounded-lg border border-line/60 p-1.5",
                isToday && "border-primary/40 bg-[color-mix(in_oklab,var(--primary)_8%,transparent)]",
              )}
            >
              <div className={cn("mb-1 text-[0.55rem]", isToday ? "font-bold text-primary-soft" : "text-muted")}>{day}</div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 2).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpen(task)}
                    className="block w-full truncate rounded bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] px-1 py-0.5 text-start text-[0.46rem]"
                    title={task.title}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 2 ? <div className="text-[0.45rem] text-muted">+{dayTasks.length - 2}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[0.55rem] text-muted">
        <span className="flex items-center gap-1"><CalendarDays className="size-3" /> {tasks.filter((task) => task.dueDate).length} مهمة بمواعيد</span>
        <span className="flex items-center gap-1"><Clock3 className="size-3" /> {tasks.filter((task) => isOverdue(task.dueDate) && task.status !== "DONE").length} متأخرة</span>
      </div>
    </SpotlightCard>
  );
}

