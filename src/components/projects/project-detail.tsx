"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  Flag,
  MessageSquare,
  Send,
  Target,
  Users,
  Wallet,
  Archive,
  CornerDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import type { CommentView, ProjectView, TaskView } from "@/lib/types";
import {
  PRIORITY_META,
  PROJECT_STATUS_META,
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  relativeTime,
} from "@/lib/utils";
import { addComment, archiveProject, moveTask } from "@/server/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { Avatar, AvatarGroup } from "@/components/ui/avatar";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { SpotlightCard } from "@/components/fx/spotlight-card";

function CommentNode({ comment, depth = 0 }: { comment: CommentView; depth?: number }) {
  return (
    <div className={cn("space-y-2", depth > 0 && "ms-6 border-s border-line ps-3")}>
      <div className="flex gap-2">
        <Avatar name={comment.author.name} hue={comment.author.avatarHue} size="xs" ring={comment.author.role.color} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] font-medium">{comment.author.name}</span>
            <span className="mono text-[0.5rem] text-muted">{relativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1 whitespace-pre-line text-[0.68rem] leading-relaxed text-fg/85">{comment.body}</p>
        </div>
      </div>
      {comment.replies.map((reply) => (
        <CommentNode key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ProjectDetail({
  project,
  tasks,
  canArchive,
  canComment,
}: {
  project: ProjectView;
  tasks: TaskView[];
  canArchive: boolean;
  canComment: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [doneIds, setDoneIds] = useState<string[]>([]);

  function toggleTask(task: TaskView) {
    const next = task.status === "DONE" ? "TODO" : "DONE";
    setDoneIds((current) => (next === "DONE" ? [...current, task.id] : current.filter((id) => id !== task.id)));
    startTransition(async () => {
      try {
        await moveTask(task.id, next);
        router.refresh();
      } catch (error) {
        setDoneIds((current) => current.filter((id) => id !== task.id));
        toast.error(error instanceof Error ? error.message : "تعذّر تحديث المهمة");
      }
    });
  }

  function submitComment(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    startTransition(async () => {
      try {
        await addComment({ entityType: "project", entityId: project.id, body });
        setComment("");
        toast.success("أُضيف التعليق");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إضافة التعليق");
      }
    });
  }

  function toggleArchive() {
    startTransition(async () => {
      try {
        await archiveProject(project.id);
        toast.success(project.status === "ARCHIVED" ? "أُعيد المشروع للنشاط" : "أُرشف المشروع");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر تحديث المشروع");
      }
    });
  }

  const budgetRatio = project.budget === 0 ? 0 : Math.min(100, Math.round((project.spent / project.budget) * 100));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[0.65rem] text-muted">
        <Link href="/projects" className="flex items-center gap-1 hover:text-fg">
          <ArrowRight className="size-3" />
          المشاريع
        </Link>
        <span>/</span>
        <span className="mono">{project.code}</span>
      </div>

      <div className="glass relative overflow-hidden rounded-[1.5rem] p-6">
        <div
          className="pointer-events-none absolute -end-20 -top-24 size-72 rounded-full opacity-30 blur-3xl"
          style={{ background: project.color }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-[0.6rem] text-muted">{project.code}</span>
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              {project.daysLeft < 0 ? <Badge tone="danger">متأخر {Math.abs(project.daysLeft)} يوم</Badge> : null}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{project.name}</h1>
            <p className="mt-2 text-xs leading-relaxed text-muted">{project.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Badge key={tag} className="text-[0.55rem]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <ProgressRing value={project.progress} size={110} stroke={7} color={project.color}>
              <div className="text-center">
                <div className="num text-xl font-bold">{project.progress}%</div>
                <div className="text-[0.5rem] text-muted">الإنجاز</div>
              </div>
            </ProgressRing>
            {canArchive ? (
              <Button variant="ghost" size="sm" onClick={toggleArchive} loading={pending}>
                <Archive className="size-3.5" />
                {project.status === "ARCHIVED" ? "إعادة تنشيط" : "أرشفة"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[
            { label: "المهام", value: `${project.taskDone}/${project.taskTotal}`, icon: CheckCircle2, color: "#22D3EE" },
            { label: "الفريق", value: `${project.members.length} أعضاء`, icon: Users, color: "#A78BFA" },
            { label: "الميزانية", value: formatCurrency(project.budget), icon: Wallet, color: "#FFB86B" },
            { label: "الاستحقاق", value: formatDate(project.dueDate), icon: CalendarDays, color: "#34D399" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_55%,transparent)] px-3 py-2">
              <div className="flex items-center gap-1.5 text-[0.55rem] text-muted">
                <item.icon className="size-3" style={{ color: item.color }} />
                {item.label}
              </div>
              <div className="num mt-1 truncate text-[0.82rem] font-semibold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full flex-wrap justify-start">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="tasks">المهام ({tasks.length})</TabsTrigger>
          <TabsTrigger value="team">الفريق ({project.members.length})</TabsTrigger>
          <TabsTrigger value="discussion">النقاش ({project.comments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SpotlightCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Flag className="size-4 text-primary-soft" />
              <h3 className="font-display text-sm font-semibold">المعالم الزمنية</h3>
            </div>
            <div className="relative space-y-4 ps-4">
              <div className="absolute inset-y-2 start-[7px] w-px bg-line" />
              {project.milestones.map((milestone) => (
                <div key={milestone.id} className="relative">
                  <span
                    className={cn(
                      "absolute -start-4 top-1 grid size-3.5 place-items-center rounded-full border-2",
                      milestone.status === "DONE"
                        ? "border-success bg-success"
                        : milestone.status === "IN_PROGRESS"
                          ? "border-primary-2 bg-[var(--bg)]"
                          : "border-line-strong bg-[var(--bg)]",
                    )}
                  >
                    {milestone.status === "DONE" ? <CheckCircle2 className="size-2 text-white" /> : null}
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[0.72rem] font-medium">{milestone.title}</span>
                    <span className="mono text-[0.55rem] text-muted">{formatDate(milestone.dueDate)}</span>
                  </div>
                  <p className="mt-0.5 text-[0.62rem] text-muted">{milestone.description}</p>
                </div>
              ))}
            </div>
          </SpotlightCard>

          <div className="grid gap-3 md:grid-cols-2">
            <SpotlightCard className="p-5">
              <h3 className="mb-3 font-display text-sm font-semibold">استهلاك الميزانية</h3>
              <div className="flex items-end justify-between">
                <div>
                  <div className="num text-2xl font-semibold">{formatCurrency(project.spent)}</div>
                  <div className="text-[0.6rem] text-muted">من أصل {formatCurrency(project.budget)}</div>
                </div>
                <span className={cn("num text-sm", budgetRatio > 80 ? "text-danger" : "text-success")}>{budgetRatio}%</span>
              </div>
              <Progress value={budgetRatio} color={budgetRatio > 80 ? "#FB7185" : "#34D399"} className="mt-3" />
              <p className="mt-3 text-[0.6rem] text-muted">
                {project.daysLeft >= 0 ? `متبقٍ ${project.daysLeft} يوماً على الاستحقاق` : `تجاوز الموعد بـ ${Math.abs(project.daysLeft)} يوماً`}
              </p>
            </SpotlightCard>

            <SpotlightCard className="p-5">
              <h3 className="mb-3 font-display text-sm font-semibold">قائد المشروع</h3>
              <div className="flex items-center gap-3">
                <Avatar name={project.owner.name} hue={project.owner.avatarHue} size="lg" ring={project.owner.role.color} />
                <div>
                  <Link href={`/members/${project.owner.id}`} className="text-sm font-medium hover:text-primary-soft">
                    {project.owner.name}
                  </Link>
                  <div className="text-[0.6rem] text-muted">{project.owner.title}</div>
                  <Badge className="mt-1 text-[0.52rem]" style={{ color: project.owner.role.color }}>
                    {project.owner.role.name}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-[0.6rem] text-muted">
                <span>بدأ في {formatDate(project.startDate)}</span>
                <span className="mono">{project.taskOverdue} مهمة متأخرة</span>
              </div>
            </SpotlightCard>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <SpotlightCard className="p-3">
            {tasks.length === 0 ? (
              <p className="py-10 text-center text-xs text-muted">لا مهام مرتبطة بهذا المشروع بعد.</p>
            ) : (
              <div className="divide-y divide-line/60">
                {tasks.map((task) => {
                  const done = task.status === "DONE" || doneIds.includes(task.id);
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-2 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleTask(task)}
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full border transition",
                          done ? "border-success bg-success/15 text-success" : "border-line-strong text-transparent hover:border-success",
                        )}
                        aria-label={done ? "إعادة فتح المهمة" : "إنجاز المهمة"}
                      >
                        <Circle className={cn("size-3", done && "hidden")} />
                        <CheckCircle2 className={cn("size-3.5", !done && "hidden")} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className={cn("truncate text-[0.72rem]", done && "text-muted line-through")}>{task.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[0.52rem] text-muted">
                          <span>{task.assignee?.name ?? "غير مسندة"}</span>
                          <span>·</span>
                          <span className="mono">{task.dueDate ? formatDate(task.dueDate) : "بلا موعد"}</span>
                        </div>
                      </div>
                      <PriorityBadge priority={task.priority} className="text-[0.5rem]" />
                    </div>
                  );
                })}
              </div>
            )}
          </SpotlightCard>
        </TabsContent>

        <TabsContent value="team">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.members.map((member) => (
              <SpotlightCard key={member.id} className="flex items-center gap-3 p-4">
                <Avatar name={member.name} hue={member.avatarHue} size="md" ring={member.role.color} />
                <div className="min-w-0">
                  <Link href={`/members/${member.id}`} className="block truncate text-[0.72rem] font-medium hover:text-primary-soft">
                    {member.name}
                  </Link>
                  <div className="truncate text-[0.55rem]" style={{ color: member.role.color }}>
                    {member.role.name}
                  </div>
                  <div className="mt-0.5 text-[0.52rem] text-muted">{member.projectRole}</div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discussion">
          <SpotlightCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="size-4 text-primary-soft" />
              <h3 className="font-display text-sm font-semibold">نقاش المشروع</h3>
            </div>

            <div className="space-y-4">
              {project.comments.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">ابدأ النقاش بأول تعليق.</p>
              ) : (
                project.comments.map((comment) => <CommentNode key={comment.id} comment={comment} />)
              )}
            </div>

            {canComment ? (
              <form action={submitComment} className="mt-5 flex items-end gap-2">
                <textarea
                  name="body"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={2}
                  placeholder="اكتب تعليقاً… استخدم @ لذكر عضو"
                  className="field flex-1 resize-none"
                />
                <Button type="submit" size="icon" loading={pending} aria-label="إرسال">
                  <Send className="size-4" />
                </Button>
              </form>
            ) : null}
          </SpotlightCard>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between text-[0.58rem] text-muted">
        <span className="flex items-center gap-1">
          <Target className="size-3" />
          {PROJECT_STATUS_META[project.status]?.label} · {PRIORITY_META[project.priority]?.label}
        </span>
        <span className="mono">آخر تحديث {formatDateTime(new Date().toISOString())}</span>
      </div>
    </div>
  );
}
