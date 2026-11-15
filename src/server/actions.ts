"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mutateDb, resetDb } from "./db";
import { assertPermission } from "./guard";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import type { AuditAction, Database } from "./data/types";

// ─────────────────────────── helpers ───────────────────────────

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (bucket.count >= limit) {
    throw new Error("تم تجاوز الحد المسموح من المحاولات، حاول بعد قليل");
  }
  bucket.count += 1;
}

function audit(
  db: Database,
  actorId: string,
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  summary: string,
) {
  db.auditLogs.unshift({
    id: `al_${randomUUID().slice(0, 8)}`,
    actorId,
    action,
    entityType,
    entityId,
    summary,
    createdAt: new Date().toISOString(),
  });
}

function notify(
  db: Database,
  userId: string,
  type: "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "MENTION" | "ASSIGNMENT" | "DEADLINE",
  title: string,
  body: string,
  href: string | null,
) {
  db.notifications.unshift({
    id: `n_${randomUUID().slice(0, 8)}`,
    userId,
    type,
    title,
    body,
    href,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

function fail(message: string): never {
  throw new Error(message);
}

function parse<S extends z.ZodTypeAny>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    fail(result.error.issues[0]?.message ?? "بيانات غير صالحة");
  }
  return result.data;
}

// ─────────────────────────── notifications ───────────────────────────

export async function markAllNotificationsRead() {
  const user = await assertPermission("dashboard.view");
  await mutateDb((db) => {
    for (const notification of db.notifications) {
      if (notification.userId === user.id) notification.read = true;
    }
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markNotificationRead(notificationId: string) {
  const user = await assertPermission("dashboard.view");
  await mutateDb((db) => {
    const notification = db.notifications.find(
      (candidate) => candidate.id === notificationId && candidate.userId === user.id,
    );
    if (notification) notification.read = true;
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─────────────────────────── proposals ───────────────────────────

const voteSchema = z.object({
  proposalId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
  reason: z.string().max(240).optional().default(""),
});

export async function voteProposal(input: { proposalId: string; value: 1 | -1; reason?: string }) {
  const user = await assertPermission("proposals.vote");
  rateLimit(`vote:${user.id}`, 20, 60_000);
  const data = parse(voteSchema, input);

  await mutateDb((db) => {
    const proposal = db.proposals.find((candidate) => candidate.id === data.proposalId);
    if (!proposal) fail("الاقتراح غير موجود");
    const existing = db.proposalVotes.find(
      (vote) => vote.proposalId === data.proposalId && vote.userId === user.id,
    );
    if (existing && existing.value === data.value) {
      db.proposalVotes = db.proposalVotes.filter((vote) => vote.id !== existing.id);
    } else if (existing) {
      existing.value = data.value;
      existing.reason = data.reason ?? existing.reason;
    } else {
      db.proposalVotes.push({
        id: `v_${randomUUID().slice(0, 8)}`,
        proposalId: data.proposalId,
        userId: user.id,
        value: data.value,
        reason: data.reason ?? "",
        createdAt: new Date().toISOString(),
      });
    }
    audit(db, user.id, "UPDATE", "proposal", proposal.id, `تصويت ${data.value === 1 ? "إيجابي" : "سلبي"} على «${proposal.title}».`);
  });

  revalidatePath("/proposals");
  revalidatePath("/dashboard");
  return { ok: true };
}

const proposalSchema = z.object({
  title: z.string().min(6, "العنوان قصير جداً").max(140),
  description: z.string().min(20, "الوصف يجب أن يكون 20 حرفاً على الأقل").max(2400),
  category: z.string().min(2),
  impact: z.coerce.number().min(1).max(5),
  effort: z.coerce.number().min(1).max(5),
  difficulty: z.coerce.number().min(1).max(5),
  estimatedCost: z.coerce.number().min(0).max(1_000_000).default(0),
  resources: z.string().max(400).optional().default(""),
});

export async function createProposal(input: z.input<typeof proposalSchema>) {
  const user = await assertPermission("proposals.create");
  rateLimit(`proposal:${user.id}`, 5, 60_000);
  const data = parse(proposalSchema, input);

  const id = await mutateDb((db) => {
    const proposalId = `pr_${randomUUID().slice(0, 8)}`;
    db.proposals.unshift({
      id: proposalId,
      title: data.title,
      description: data.description,
      category: data.category,
      impact: data.impact,
      effort: data.effort,
      difficulty: data.difficulty,
      resources: data.resources
        .split(/[,،\n]/)
        .map((resource) => resource.trim())
        .filter(Boolean),
      estimatedCost: data.estimatedCost,
      status: "NEW",
      authorId: user.id,
      projectId: null,
      createdAt: new Date().toISOString(),
    });
    audit(db, user.id, "CREATE", "proposal", proposalId, `اقتراح جديد: «${data.title}».`);
    return proposalId;
  });

  revalidatePath("/proposals");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function updateProposalStatus(proposalId: string, status: "UNDER_REVIEW" | "ACCEPTED" | "REJECTED") {
  const user = await assertPermission("proposals.review");
  const parsed = parse(
    z.object({
      proposalId: z.string().min(1),
      status: z.enum(["UNDER_REVIEW", "ACCEPTED", "REJECTED"]),
    }),
    { proposalId, status },
  );

  await mutateDb((db) => {
    const proposal = db.proposals.find((candidate) => candidate.id === parsed.proposalId);
    if (!proposal) fail("الاقتراح غير موجود");
    proposal.status = parsed.status;
    const labels = { UNDER_REVIEW: "قيد المراجعة", ACCEPTED: "مقبول", REJECTED: "مرفوض" } as const;
    audit(db, user.id, parsed.status === "REJECTED" ? "REJECT" : "APPROVE", "proposal", proposal.id, `تغيير حالة «${proposal.title}» إلى ${labels[parsed.status]}.`);
    notify(
      db,
      proposal.authorId,
      parsed.status === "REJECTED" ? "WARNING" : "SUCCESS",
      `تحديث على اقتراحك: ${labels[parsed.status]}`,
      proposal.title,
      "/proposals",
    );
  });

  revalidatePath("/proposals");
  return { ok: true };
}

export async function convertProposalToProject(proposalId: string) {
  const user = await assertPermission("proposals.convert");
  const parsed = parse(z.object({ proposalId: z.string().min(1) }), { proposalId });

  const projectId = await mutateDb((db) => {
    const proposal = db.proposals.find((candidate) => candidate.id === parsed.proposalId);
    if (!proposal) fail("الاقتراح غير موجود");
    if (proposal.projectId) fail("تم تحويل هذا الاقتراح مسبقاً");

    const nextNumber = String(db.projects.length + 1).padStart(2, "0");
    const newId = `p_${randomUUID().slice(0, 8)}`;
    const due = new Date();
    due.setDate(due.getDate() + 60);

    db.projects.push({
      id: newId,
      code: `TCT-${nextNumber}`,
      name: proposal.title,
      description: proposal.description,
      status: "PLANNING",
      priority: proposal.impact >= 4 ? "HIGH" : "MEDIUM",
      budget: proposal.estimatedCost,
      spent: 0,
      color: "#A78BFA",
      tags: [proposal.category, ...proposal.resources.slice(0, 2)],
      startDate: new Date().toISOString(),
      dueDate: due.toISOString(),
      ownerId: user.id,
      members: [
        { userId: user.id, role: "قائد المشروع" },
        { userId: proposal.authorId, role: "صاحب الفكرة" },
      ],
      createdAt: new Date().toISOString(),
    });

    proposal.status = "CONVERTED";
    proposal.projectId = newId;

    db.milestones.push(
      {
        id: `m_${randomUUID().slice(0, 8)}`,
        projectId: newId,
        title: "تحديد النطاق",
        description: "ورشة نطاق مع الفريق وصاحب الاقتراح.",
        dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        status: "PENDING",
        order: 1,
      },
      {
        id: `m_${randomUUID().slice(0, 8)}`,
        projectId: newId,
        title: "نموذج أولي",
        description: "نسخة قابلة للتجربة.",
        dueDate: new Date(Date.now() + 28 * 86_400_000).toISOString(),
        status: "PENDING",
        order: 2,
      },
    );

    audit(db, user.id, "APPROVE", "proposal", proposal.id, `تحويل «${proposal.title}» إلى مشروع ${`TCT-${nextNumber}`}.`);
    notify(db, proposal.authorId, "SUCCESS", "تحوّل اقتراحك إلى مشروع 🎉", proposal.title, `/projects/${newId}`);
    return newId;
  });

  revalidatePath("/proposals");
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, projectId };
}

// ─────────────────────────── tasks ───────────────────────────

export async function moveTask(taskId: string, status: string, order?: number) {
  const user = await assertPermission("tasks.edit");
  const parsed = parse(
    z.object({
      taskId: z.string().min(1),
      status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"]),
      order: z.number().optional(),
    }),
    { taskId, status, order },
  );

  await mutateDb((db) => {
    const task = db.tasks.find((candidate) => candidate.id === parsed.taskId);
    if (!task) fail("المهمة غير موجودة");
    const wasDone = task.status === "DONE";
    task.status = parsed.status;
    if (typeof parsed.order === "number") task.order = parsed.order;
    task.completedAt = parsed.status === "DONE" ? new Date().toISOString() : null;

    if (parsed.status === "DONE" && !wasDone && task.assigneeId) {
      const assignee = db.users.find((candidate) => candidate.id === task.assigneeId);
      if (assignee) {
        assignee.points += 10;
        db.pointTransactions.unshift({
          id: `pt_${randomUUID().slice(0, 8)}`,
          userId: assignee.id,
          points: 10,
          reason: `إنجاز مهمة: ${task.title}`,
          source: "task",
          createdAt: new Date().toISOString(),
        });
        notify(db, assignee.id, "SUCCESS", "أُنجزت مهمة +10 نقاط", task.title, "/tasks");
      }
    }
    audit(db, user.id, "UPDATE", "task", task.id, `نقل «${task.title}» إلى ${parsed.status}.`);
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function toggleSubtask(subtaskId: string, done: boolean) {
  await assertPermission("tasks.edit");
  const parsed = parse(z.object({ subtaskId: z.string(), done: z.boolean() }), { subtaskId, done });
  await mutateDb((db) => {
    const subtask = db.subtasks.find((candidate) => candidate.id === parsed.subtaskId);
    if (!subtask) fail("المهمة الفرعية غير موجودة");
    subtask.done = parsed.done;
  });
  revalidatePath("/tasks");
  return { ok: true };
}

const taskSchema = z.object({
  title: z.string().min(4, "عنوان المهمة قصير").max(160),
  description: z.string().max(1200).optional().default(""),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  dueDate: z.string().optional().nullable(),
  estimate: z.coerce.number().min(0).max(2400).optional().default(0),
});

export async function createTask(input: z.input<typeof taskSchema>) {
  const user = await assertPermission("tasks.create");
  rateLimit(`task:${user.id}`, 12, 60_000);
  const data = parse(taskSchema, input);

  const id = await mutateDb((db) => {
    const taskId = `t_${randomUUID().slice(0, 8)}`;
    const order = db.tasks.filter((task) => task.status === data.status).length + 1;
    db.tasks.unshift({
      id: taskId,
      title: data.title,
      description: data.description ?? "",
      status: data.status,
      priority: data.priority,
      projectId: data.projectId || null,
      assigneeId: data.assigneeId || null,
      createdById: user.id,
      meetingId: null,
      dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
      estimate: data.estimate ? Number(data.estimate) : null,
      order,
      labels: [],
      recurrence: "none",
      completedAt: null,
      createdAt: new Date().toISOString(),
    });
    audit(db, user.id, "CREATE", "task", taskId, `مهمة جديدة: «${data.title}».`);
    if (data.assigneeId) {
      notify(db, data.assigneeId, "ASSIGNMENT", "مهمة جديدة مسندة إليك", data.title, "/tasks");
    }
    return taskId;
  });

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function logTime(taskId: string, minutes: number, note = "") {
  const user = await assertPermission("tasks.view");
  const parsed = parse(
    z.object({ taskId: z.string(), minutes: z.number().min(1).max(600), note: z.string().max(200).optional() }),
    { taskId, minutes, note },
  );
  await mutateDb((db) => {
    const task = db.tasks.find((candidate) => candidate.id === parsed.taskId);
    if (!task) fail("المهمة غير موجودة");
    const now = new Date();
    db.timeEntries.unshift({
      id: `te_${randomUUID().slice(0, 8)}`,
      taskId: parsed.taskId,
      userId: user.id,
      minutes: Math.round(parsed.minutes),
      note: parsed.note ?? "",
      startedAt: new Date(now.getTime() - parsed.minutes * 60_000).toISOString(),
      endedAt: now.toISOString(),
    });
    audit(db, user.id, "UPDATE", "task", task.id, `تسجيل ${Math.round(parsed.minutes)} دقيقة على «${task.title}».`);
  });
  revalidatePath("/tasks");
  return { ok: true };
}

// ─────────────────────────── projects ───────────────────────────

const projectSchema = z.object({
  name: z.string().min(4, "اسم المشروع قصير").max(140),
  description: z.string().min(20, "الوصف قصير جداً").max(2000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  dueDate: z.string().min(4, "حدد تاريخاً"),
  budget: z.coerce.number().min(0).max(5_000_000).default(0),
  tags: z.string().max(200).optional().default(""),
  memberIds: z.array(z.string()).optional().default([]),
});

export async function createProject(input: z.input<typeof projectSchema>) {
  const user = await assertPermission("projects.create");
  rateLimit(`project:${user.id}`, 6, 60_000);
  const data = parse(projectSchema, input);

  const id = await mutateDb((db) => {
    const newId = `p_${randomUUID().slice(0, 8)}`;
    const nextNumber = String(db.projects.length + 1).padStart(2, "0");
    const memberIds = Array.from(new Set([user.id, ...data.memberIds]));
    db.projects.unshift({
      id: newId,
      code: `TCT-${nextNumber}`,
      name: data.name,
      description: data.description,
      status: "PLANNING",
      priority: data.priority,
      budget: Number(data.budget),
      spent: 0,
      color: "#7C5CFF",
      tags: data.tags.split(/[,،]/).map((tag) => tag.trim()).filter(Boolean),
      startDate: new Date().toISOString(),
      dueDate: new Date(data.dueDate).toISOString(),
      ownerId: user.id,
      members: memberIds.map((memberId) => ({
        userId: memberId,
        role: memberId === user.id ? "قائد المشروع" : "عضو",
      })),
      createdAt: new Date().toISOString(),
    });
    audit(db, user.id, "CREATE", "project", newId, `مشروع جديد: «${data.name}».`);
    for (const memberId of memberIds) {
      if (memberId === user.id) continue;
      notify(db, memberId, "INFO", "أُضفت إلى مشروع جديد", data.name, `/projects/${newId}`);
    }
    return newId;
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, id };
}

export async function archiveProject(projectId: string) {
  const user = await assertPermission("projects.archive");
  const parsed = parse(z.object({ projectId: z.string() }), { projectId });
  await mutateDb((db) => {
    const project = db.projects.find((candidate) => candidate.id === parsed.projectId);
    if (!project) fail("المشروع غير موجود");
    project.status = project.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
    audit(db, user.id, "UPDATE", "project", project.id, `تغيير أرشفة «${project.name}» إلى ${project.status}.`);
  });
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─────────────────────────── meetings ───────────────────────────

export async function toggleAttendance(meetingId: string, userId: string, status: "PRESENT" | "LATE" | "ABSENT" | "EXCUSED") {
  const actor = await assertPermission("meetings.attendance");
  const parsed = parse(
    z.object({
      meetingId: z.string(),
      userId: z.string(),
      status: z.enum(["PRESENT", "LATE", "ABSENT", "EXCUSED"]),
    }),
    { meetingId, userId, status },
  );

  await mutateDb((db) => {
    const meeting = db.meetings.find((candidate) => candidate.id === parsed.meetingId);
    if (!meeting) fail("الاجتماع غير موجود");
    const record = meeting.attendance.find((entry) => entry.userId === parsed.userId);
    if (record) record.status = parsed.status;
    else meeting.attendance.push({ userId: parsed.userId, status: parsed.status });
    audit(db, actor.id, "UPDATE", "meeting", meeting.id, `تحديث حضور ${parsed.userId} في «${meeting.title}» إلى ${parsed.status}.`);
  });

  revalidatePath("/meetings");
  return { ok: true };
}

export async function saveMeetingMinutes(meetingId: string, minutes: string) {
  const user = await assertPermission("meetings.minutes");
  const parsed = parse(
    z.object({ meetingId: z.string(), minutes: z.string().max(12_000) }),
    { meetingId, minutes },
  );
  await mutateDb((db) => {
    const meeting = db.meetings.find((candidate) => candidate.id === parsed.meetingId);
    if (!meeting) fail("الاجتماع غير موجود");
    meeting.minutes = parsed.minutes;
    audit(db, user.id, "UPDATE", "meeting", meeting.id, `تحديث محضر «${meeting.title}».`);
  });
  revalidatePath("/meetings");
  return { ok: true };
}

// ─────────────────────────── comms ───────────────────────────

export async function sendMessage(channelId: string, body: string) {
  const user = await assertPermission("comms.view");
  rateLimit(`message:${user.id}`, 30, 60_000);
  const parsed = parse(
    z.object({ channelId: z.string(), body: z.string().min(1).max(1200) }),
    { channelId, body },
  );

  const message = await mutateDb((db) => {
    const channel = db.channels.find((candidate) => candidate.id === parsed.channelId);
    if (!channel) fail("القناة غير موجودة");
    const entry = {
      id: `msg_${randomUUID().slice(0, 8)}`,
      channelId: parsed.channelId,
      authorId: user.id,
      body: parsed.body,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(entry);
    return entry;
  });

  revalidatePath("/comms");
  return { ok: true, messageId: message.id };
}

// ─────────────────────────── settings & RBAC ───────────────────────────

export async function updateRolePermissions(roleId: string, permissions: string[]) {
  const user = await assertPermission("members.rank.edit");
  const parsed = parse(
    z.object({
      roleId: z.string(),
      permissions: z.array(z.string()).max(ALL_PERMISSIONS.length + 5),
    }),
    { roleId, permissions },
  );

  const valid = parsed.permissions.filter((permission) => ALL_PERMISSIONS.includes(permission));

  await mutateDb((db) => {
    const role = db.roles.find((candidate) => candidate.id === parsed.roleId);
    if (!role) fail("الرتبة غير موجودة");
    if (!user.permissions.includes("system.danger")) fail("فقط رئيس اللجنة يعدّل الرتب");
    const before = role.permissionKeys.length;
    role.permissionKeys = Array.from(new Set(valid));
    audit(
      db,
      user.id,
      "RANK_CHANGE",
      "role",
      role.id,
      `تعديل صلاحيات «${role.name}»: ${before} → ${role.permissionKeys.length} صلاحية.`,
    );
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateMemberRole(userId: string, roleId: string) {
  const actor = await assertPermission("members.rank.edit");
  if (!actor.permissions.includes("system.danger")) fail("فقط رئيس اللجنة يعدّل رتب الأعضاء");
  const parsed = parse(
    z.object({ userId: z.string().min(1), roleId: z.string().min(1) }),
    { userId, roleId },
  );

  await mutateDb((db) => {
    const user = db.users.find((candidate) => candidate.id === parsed.userId);
    const role = db.roles.find((candidate) => candidate.id === parsed.roleId);
    if (!user || !role) fail("العضو أو الرتبة غير موجودة");
    const previousRole = db.roles.find((candidate) => candidate.id === user.roleId);
    user.roleId = role.id;
    audit(
      db,
      actor.id,
      "RANK_CHANGE",
      "user",
      user.id,
      `تغيير رتبة ${user.name} من «${previousRole?.name ?? "—"}» إلى «${role.name}».`,
    );
    notify(db, user.id, "SUCCESS", "تحديث رتبتك", `تم نقلك إلى رتبة «${role.name}».`, "/settings");
  });

  revalidatePath("/settings");
  revalidatePath("/members");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createRole(input: { name: string; nameEn: string; color: string; level: number }) {
  const actor = await assertPermission("members.rank.edit");
  if (!actor.permissions.includes("system.danger")) fail("فقط رئيس اللجنة ينشئ الرتب");
  const data = parse(
    z.object({
      name: z.string().min(2, "اسم الرتبة قصير").max(40),
      nameEn: z.string().min(2).max(40),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "لون غير صالح"),
      level: z.coerce.number().min(1).max(99),
    }),
    input,
  );

  const id = await mutateDb((db) => {
    if (db.roles.some((role) => role.name === data.name)) fail("توجد رتبة بهذا الاسم");
    const roleId = `role_${randomUUID().slice(0, 8)}`;
    db.roles.push({
      id: roleId,
      name: data.name,
      nameEn: data.nameEn,
      description: "رتبة مخصصة أُنشئت من لوحة الإدارة.",
      color: data.color,
      icon: "shield-check",
      level: Number(data.level),
      isSystem: false,
      permissionKeys: ["dashboard.view", "projects.view", "tasks.view", "members.view"],
    });
    audit(db, actor.id, "CREATE", "role", roleId, `إنشاء رتبة جديدة «${data.name}» بمستوى ${data.level}.`);
    return roleId;
  });

  revalidatePath("/settings");
  return { ok: true, id };
}

export async function inviteMember(email: string, roleId: string) {
  const user = await assertPermission("members.invite");
  const parsed = parse(
    z.object({ email: z.string().email("بريد غير صالح"), roleId: z.string() }),
    { email, roleId },
  );

  const code = await mutateDb((db) => {
    const role = db.roles.find((candidate) => candidate.id === parsed.roleId);
    if (!role) fail("الرتبة غير موجودة");
    const inviteCode = `TCT-${randomUUID().slice(0, 4).toUpperCase()}`;
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    db.invitations.unshift({
      id: `inv_${randomUUID().slice(0, 8)}`,
      code: inviteCode,
      email: parsed.email,
      roleId: parsed.roleId,
      invitedById: user.id,
      status: "pending",
      expiresAt: expires.toISOString(),
      createdAt: new Date().toISOString(),
    });
    audit(db, user.id, "CREATE", "invitation", inviteCode, `دعوة جديدة (${parsed.email}) برتبة «${role.name}».`);
    return inviteCode;
  });

  revalidatePath("/members");
  revalidatePath("/settings");
  return { ok: true, code };
}

export async function updateSettings(values: Record<string, string | boolean | number>) {
  const user = await assertPermission("settings.edit");
  const parsed = parse(
    z.record(
      z.string(),
      z.union([z.string().max(400), z.boolean(), z.number()]),
    ),
    values,
  );

  await mutateDb((db) => {
    for (const [key, value] of Object.entries(parsed)) {
      db.settings[key] = value;
    }
    audit(db, user.id, "UPDATE", "setting", null, `تحديث ${Object.keys(parsed).length} إعداداً في النظام.`);
  });

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetDemoDatabase() {
  const user = await assertPermission("system.danger");
  await resetDb();
  revalidatePath("/", "layout");
  return { ok: true, by: user.name };
}

// ─────────────────────────── comments ───────────────────────────

export async function addComment(input: {
  entityType: "task" | "project" | "proposal";
  entityId: string;
  body: string;
  parentId?: string | null;
}) {
  const user = await assertPermission("dashboard.view");
  rateLimit(`comment:${user.id}`, 20, 60_000);
  const data = parse(
    z.object({
      entityType: z.enum(["task", "project", "proposal"]),
      entityId: z.string(),
      body: z.string().min(2, "التعليق قصير جداً").max(1600),
      parentId: z.string().nullable().optional(),
    }),
    input,
  );

  await mutateDb((db) => {
    db.comments.push({
      id: `c_${randomUUID().slice(0, 8)}`,
      entityType: data.entityType,
      entityId: data.entityId,
      authorId: user.id,
      body: data.body,
      parentId: data.parentId ?? null,
      mentions: Array.from(data.body.matchAll(/@([\w\u0600-\u06FF]+)/g)).map((match) => match[1] ?? ""),
      createdAt: new Date().toISOString(),
    });
    audit(db, user.id, "CREATE", data.entityType, data.entityId, `تعليق جديد: «${data.body.slice(0, 60)}…»`);

    if (data.parentId) {
      const parent = db.comments.find((candidate) => candidate.id === data.parentId);
      if (parent && parent.authorId !== user.id) {
        notify(db, parent.authorId, "MENTION", "ردّ جديد على تعليقك", data.body.slice(0, 120), null);
      }
    }
  });

  revalidatePath("/tasks");
  revalidatePath("/projects");
  revalidatePath("/proposals");
  return { ok: true };
}
