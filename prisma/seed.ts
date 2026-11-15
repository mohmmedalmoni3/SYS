/**
 * TECTNAL — Prisma seed
 * ------------------------------------------------------------------
 * Usage:
 *   npx prisma db push
 *   npx tsx prisma/seed.ts
 *
 * Seeds the full PostgreSQL schema with the same realistic Arabic
 * dataset used by the zero-infrastructure demo mode.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { createDatabase } from "../src/server/data";
import { PERMISSIONS } from "../src/lib/permissions";

const prisma = new PrismaClient();
const data = createDatabase();

const json = (value: unknown) => value as Prisma.InputJsonValue;

async function wipe() {
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.article.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.agendaItem.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.proposalVote.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.setting.deleteMany();
}

async function main() {
  console.log("→ wiping existing data");
  await wipe();

  console.log("→ permissions");
  await prisma.permission.createMany({
    data: PERMISSIONS.map((permission) => ({
      key: permission.key,
      label: permission.label,
      labelEn: permission.labelEn,
      group: permission.group,
    })),
  });

  console.log("→ roles + permission matrix");
  for (const role of data.roles) {
    await prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        nameEn: role.nameEn,
        description: role.description,
        color: role.color,
        icon: role.icon,
        level: role.level,
        isSystem: role.isSystem,
        permissions: {
          create: role.permissionKeys.map((key) => ({ permission: { connect: { key } } })),
        },
      },
    });
  }

  console.log("→ members");
  await prisma.user.createMany({
    data: data.users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      image: user.image,
      bio: user.bio,
      title: user.title,
      department: user.department,
      phone: user.phone,
      location: user.location,
      skills: user.skills,
      points: user.points,
      level: user.level,
      status: user.status,
      joinedAt: new Date(user.joinedAt),
      lastActiveAt: new Date(user.lastActiveAt),
      roleId: user.roleId,
    })),
  });

  console.log("→ projects + milestones + members");
  for (const project of data.projects) {
    await prisma.project.create({
      data: {
        id: project.id,
        code: project.code,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget,
        spent: project.spent,
        color: project.color,
        tags: project.tags,
        startDate: new Date(project.startDate),
        dueDate: new Date(project.dueDate),
        ownerId: project.ownerId,
        createdAt: new Date(project.createdAt),
        members: {
          create: project.members.map((member) => ({
            userId: member.userId,
            role: member.role,
          })),
        },
      },
    });
  }

  await prisma.milestone.createMany({
    data: data.milestones.map((milestone) => ({
      id: milestone.id,
      projectId: milestone.projectId,
      title: milestone.title,
      description: milestone.description,
      dueDate: new Date(milestone.dueDate),
      status: milestone.status,
      order: milestone.order,
    })),
  });

  console.log("→ tasks, subtasks, dependencies, time entries");
  await prisma.task.createMany({
    data: data.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      assigneeId: task.assigneeId,
      createdById: task.createdById,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      estimate: task.estimate,
      order: task.order,
      labels: task.labels,
      recurrence: task.recurrence,
      completedAt: task.completedAt ? new Date(task.completedAt) : null,
      createdAt: new Date(task.createdAt),
    })),
  });

  await prisma.subtask.createMany({
    data: data.subtasks.map((subtask) => ({
      id: subtask.id,
      taskId: subtask.taskId,
      title: subtask.title,
      done: subtask.done,
      order: subtask.order,
    })),
  });

  await prisma.taskDependency.createMany({
    data: data.taskDependencies.map((dependency) => ({
      id: dependency.id,
      taskId: dependency.taskId,
      dependsOnId: dependency.dependsOnId,
    })),
  });

  await prisma.timeEntry.createMany({
    data: data.timeEntries.map((entry) => ({
      id: entry.id,
      taskId: entry.taskId,
      userId: entry.userId,
      minutes: entry.minutes,
      note: entry.note,
      startedAt: new Date(entry.startedAt),
      endedAt: entry.endedAt ? new Date(entry.endedAt) : null,
    })),
  });

  console.log("→ proposals + votes");
  await prisma.proposal.createMany({
    data: data.proposals.map((proposal) => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      category: proposal.category,
      impact: proposal.impact,
      effort: proposal.effort,
      difficulty: proposal.difficulty,
      resources: proposal.resources,
      estimatedCost: proposal.estimatedCost,
      status: proposal.status,
      authorId: proposal.authorId,
      projectId: proposal.projectId,
      createdAt: new Date(proposal.createdAt),
    })),
  });

  await prisma.proposalVote.createMany({
    data: data.proposalVotes.map((vote) => ({
      id: vote.id,
      proposalId: vote.proposalId,
      userId: vote.userId,
      value: vote.value,
      reason: vote.reason,
      createdAt: new Date(vote.createdAt),
    })),
  });

  console.log("→ threaded comments");
  await prisma.comment.createMany({
    data: data.comments.map((comment) => ({
      id: comment.id,
      entityType: comment.entityType,
      entityId: comment.entityId,
      taskId: comment.entityType === "task" ? comment.entityId : null,
      projectId: comment.entityType === "project" ? comment.entityId : null,
      proposalId: comment.entityType === "proposal" ? comment.entityId : null,
      authorId: comment.authorId,
      body: comment.body,
      parentId: comment.parentId,
      mentions: comment.mentions,
      createdAt: new Date(comment.createdAt),
    })),
  });

  console.log("→ meetings, agenda, attendance");
  for (const meeting of data.meetings) {
    await prisma.meeting.create({
      data: {
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        type: meeting.type,
        status: meeting.status,
        startsAt: new Date(meeting.startsAt),
        endsAt: new Date(meeting.endsAt),
        location: meeting.location,
        meetUrl: meeting.meetUrl,
        hostId: meeting.hostId,
        projectId: meeting.projectId,
        minutes: meeting.minutes,
        createdAt: new Date(meeting.createdAt),
        agenda: {
          create: meeting.agenda.map((item, index) => ({
            id: item.id,
            title: item.title,
            duration: item.duration,
            order: index,
            notes: item.notes,
          })),
        },
        attendances: {
          create: meeting.attendance.map((record) => ({
            userId: record.userId,
            status: record.status,
            note: record.note ?? null,
          })),
        },
      },
    });
  }

  console.log("→ gamification");
  await prisma.achievement.createMany({
    data: data.achievements.map((achievement) => ({
      id: achievement.id,
      userId: achievement.userId,
      title: achievement.title,
      description: achievement.description,
      points: achievement.points,
      icon: achievement.icon,
      rarity: achievement.rarity,
      earnedAt: new Date(achievement.earnedAt),
      awardedById: achievement.awardedById,
    })),
  });

  await prisma.badge.createMany({
    data: data.badges.map((badge) => ({
      id: badge.id,
      key: badge.key,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      rarity: badge.rarity,
    })),
  });

  await prisma.userBadge.createMany({
    data: data.userBadges.map((entry) => ({
      userId: entry.userId,
      badgeId: data.badges.find((badge) => badge.key === entry.badgeKey)?.id ?? "",
      earnedAt: new Date(entry.earnedAt),
    })),
  });

  await prisma.pointTransaction.createMany({
    data: data.pointTransactions.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      points: entry.points,
      reason: entry.reason,
      source: entry.source,
      createdAt: new Date(entry.createdAt),
    })),
  });

  console.log("→ knowledge hub");
  await prisma.article.createMany({
    data: data.articles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      tags: article.tags,
      readTime: article.readTime,
      views: article.views,
      authorId: article.authorId,
      status: article.status,
      publishedAt: new Date(article.publishedAt),
    })),
  });

  console.log("→ files");
  await prisma.folder.createMany({
    data: data.folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId,
      color: folder.color,
    })),
  });

  await prisma.asset.createMany({
    data: data.assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      url: `/files/${asset.id}`,
      kind: asset.kind,
      size: asset.size,
      folderId: asset.folderId,
      projectId: asset.projectId,
      uploaderId: asset.uploaderId,
      createdAt: new Date(asset.createdAt),
    })),
  });

  console.log("→ comms");
  for (const channel of data.channels) {
    await prisma.channel.create({
      data: {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        icon: channel.icon,
        isPrivate: channel.isPrivate,
        members: {
          create: channel.memberIds.map((userId) => ({ userId })),
        },
      },
    });
  }

  await prisma.message.createMany({
    data: data.messages.map((message) => ({
      id: message.id,
      channelId: message.channelId,
      authorId: message.authorId,
      body: message.body,
      createdAt: new Date(message.createdAt),
    })),
  });

  await prisma.announcement.createMany({
    data: data.announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      pinned: announcement.pinned,
      priority: announcement.priority,
      authorId: announcement.authorId,
      createdAt: new Date(announcement.createdAt),
    })),
  });

  await prisma.notification.createMany({
    data: data.notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      href: notification.href,
      read: notification.read,
      createdAt: new Date(notification.createdAt),
    })),
  });

  console.log("→ audit + invites + settings");
  await prisma.auditLog.createMany({
    data: data.auditLogs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      summary: log.summary,
      createdAt: new Date(log.createdAt),
    })),
  });

  await prisma.invitation.createMany({
    data: data.invitations.map((invitation) => ({
      id: invitation.id,
      code: invitation.code,
      email: invitation.email,
      roleId: invitation.roleId,
      invitedById: invitation.invitedById,
      status: invitation.status,
      expiresAt: new Date(invitation.expiresAt),
      createdAt: new Date(invitation.createdAt),
    })),
  });

  await prisma.setting.createMany({
    data: Object.entries(data.settings).map(([key, value]) => ({ key, value: json(value) })),
  });

  console.log("✓ seed complete — 14 members, 8 projects, 40 tasks, 12 proposals");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
