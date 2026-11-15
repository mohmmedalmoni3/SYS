import { getDb } from "./db";
import type {
  Achievement,
  Article,
  Asset,
  Comment,
  Database,
  Meeting,
  Project,
  Proposal,
  Role,
  Task,
  User,
} from "./data/types";
import { clamp } from "@/lib/utils";
import type {
  AchievementView,
  ActivityItem,
  AnnouncementView,
  ArticleView,
  AssetView,
  AuditEntryView,
  BadgeView,
  ChannelView,
  CommentView,
  DashboardView,
  LeaderboardEntry,
  MemberLite,
  MemberView,
  MeetingView,
  NotificationView,
  ProjectView,
  ProposalView,
  RoleLite,
  RoleView,
  TaskView,
  TrendPoint,
} from "@/lib/types";

// ───────────────────────────── helpers ─────────────────────────────

function roleLite(role: Role | undefined): RoleLite {
  if (!role) {
    return { id: "role_guest", name: "ضيف", nameEn: "Guest", color: "#94A3B8", icon: "eye", level: 10 };
  }
  return {
    id: role.id,
    name: role.name,
    nameEn: role.nameEn,
    color: role.color,
    icon: role.icon,
    level: role.level,
  };
}

function memberLite(db: Database, userId: string | null | undefined): MemberLite | null {
  if (!userId) return null;
  const user = db.users.find((candidate) => candidate.id === userId);
  if (!user) return null;
  const role = db.roles.find((candidate) => candidate.id === user.roleId);
  return {
    id: user.id,
    name: user.name,
    title: user.title,
    avatarHue: user.avatarHue,
    role: roleLite(role),
  };
}

function requireMember(db: Database, userId: string | null | undefined): MemberLite {
  return (
    memberLite(db, userId) ?? {
      id: "unknown",
      name: "عضو غير معروف",
      title: "—",
      avatarHue: 220,
      role: roleLite(undefined),
    }
  );
}

function projectLabel(db: Database, projectId: string | null) {
  if (!projectId) return null;
  const project = db.projects.find((candidate) => candidate.id === projectId);
  if (!project) return null;
  return { id: project.id, name: project.name, code: project.code, color: project.color };
}

function buildCommentTree(db: Database, entityType: Comment["entityType"], entityId: string): CommentView[] {
  const all = db.comments
    .filter((comment) => comment.entityType === entityType && comment.entityId === entityId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const map = new Map<string, CommentView>();
  for (const comment of all) {
    map.set(comment.id, {
      id: comment.id,
      body: comment.body,
      author: requireMember(db, comment.authorId),
      createdAt: comment.createdAt,
      mentions: comment.mentions,
      replies: [],
    });
  }

  const roots: CommentView[] = [];
  for (const comment of all) {
    const node = map.get(comment.id);
    if (!node) continue;
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function countComments(db: Database, entityType: Comment["entityType"], entityId: string): number {
  return db.comments.filter(
    (comment) => comment.entityType === entityType && comment.entityId === entityId,
  ).length;
}

function projectTasks(db: Database, projectId: string): Task[] {
  return db.tasks.filter((task) => task.projectId === projectId);
}

function projectProgress(project: Project, tasks: Task[]): number {
  if (project.status === "COMPLETED") return 100;
  if (tasks.length === 0) return project.status === "ARCHIVED" ? 100 : 0;
  const done = tasks.filter((task) => task.status === "DONE").length;
  return Math.round((done / tasks.length) * 100);
}

function daysLeft(dueDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - now.getTime()) / 86_400_000);
}

function taskView(db: Database, task: Task): TaskView {
  const subtasks = db.subtasks
    .filter((subtask) => subtask.taskId === task.id)
    .sort((a, b) => a.order - b.order);
  const timeSpent = db.timeEntries
    .filter((entry) => entry.taskId === task.id)
    .reduce((total, entry) => total + entry.minutes, 0);
  const dependencies = db.taskDependencies
    .filter((dependency) => dependency.taskId === task.id)
    .map((dependency) => {
      const blocking = db.tasks.find((candidate) => candidate.id === dependency.dependsOnId);
      return blocking ? { id: blocking.id, title: blocking.title, status: blocking.status } : null;
    })
    .filter((dependency): dependency is { id: string; title: string; status: Task["status"] } =>
      Boolean(dependency),
    );

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    project: projectLabel(db, task.projectId),
    assignee: memberLite(db, task.assigneeId),
    creator: memberLite(db, task.createdById),
    dueDate: task.dueDate,
    estimate: task.estimate,
    labels: task.labels,
    subtasks: subtasks.map((subtask) => ({ id: subtask.id, title: subtask.title, done: subtask.done })),
    doneSubtasks: subtasks.filter((subtask) => subtask.done).length,
    timeSpent,
    dependencies,
    commentsCount: countComments(db, "task", task.id),
    recurrence: task.recurrence,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    order: task.order,
  };
}

function proposalScore(proposal: Proposal, upvotes: number, downvotes: number): number {
  const voteScore = upvotes - downvotes;
  const raw =
    20 +
    proposal.impact * 14 +
    proposal.difficulty * 4 -
    proposal.effort * 6 +
    voteScore * 5;
  return clamp(Math.round(raw), 1, 100);
}

function proposalView(db: Database, proposal: Proposal, viewerId: string, rank = 0): ProposalView {
  const votes = db.proposalVotes.filter((vote) => vote.proposalId === proposal.id);
  const upvotes = votes.filter((vote) => vote.value === 1).length;
  const downvotes = votes.filter((vote) => vote.value === -1).length;
  const mine = votes.find((vote) => vote.userId === viewerId);
  return {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    category: proposal.category,
    status: proposal.status,
    impact: proposal.impact,
    effort: proposal.effort,
    difficulty: proposal.difficulty,
    score: proposalScore(proposal, upvotes, downvotes),
    upvotes,
    downvotes,
    myVote: mine ? (mine.value as 1 | -1) : 0,
    author: requireMember(db, proposal.authorId),
    createdAt: proposal.createdAt,
    projectId: proposal.projectId,
    estimatedCost: proposal.estimatedCost,
    resources: proposal.resources,
    comments: buildCommentTree(db, "proposal", proposal.id),
    commentCount: countComments(db, "proposal", proposal.id),
    rank,
  };
}

function meetingView(db: Database, meeting: Meeting): MeetingView {
  const start = new Date(meeting.startsAt);
  const end = new Date(meeting.endsAt);
  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    type: meeting.type,
    status: meeting.status,
    startsAt: meeting.startsAt,
    endsAt: meeting.endsAt,
    location: meeting.location,
    meetUrl: meeting.meetUrl,
    host: requireMember(db, meeting.hostId),
    project: projectLabel(db, meeting.projectId),
    agenda: meeting.agenda,
    attendance: meeting.attendance.map((record) => ({
      member: requireMember(db, record.userId),
      status: record.status,
      note: record.note,
    })),
    attendedCount: meeting.attendance.filter((record) => record.status === "PRESENT" || record.status === "LATE")
      .length,
    totalMembers: meeting.attendance.length,
    minutes: meeting.minutes,
    durationMinutes: Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)),
  };
}

function memberStats(db: Database, user: User) {
  const tasks = db.tasks.filter((task) => task.assigneeId === user.id);
  const attendanceRecords = db.meetings.flatMap((meeting) =>
    meeting.attendance.filter((record) => record.userId === user.id),
  );
  const attended = attendanceRecords.filter(
    (record) => record.status === "PRESENT" || record.status === "LATE",
  ).length;
  const achievements = db.achievements.filter((achievement) => achievement.userId === user.id).length;

  return {
    projects: db.projects.filter(
      (project) => project.ownerId === user.id || project.members.some((member) => member.userId === user.id),
    ).length,
    tasksDone: tasks.filter((task) => task.status === "DONE").length,
    tasksOpen: tasks.filter((task) => task.status !== "DONE").length,
    attendanceRate:
      attendanceRecords.length === 0 ? 100 : Math.round((attended / attendanceRecords.length) * 100),
    achievements,
    points: user.points,
  };
}

function badgeLites(db: Database, userId: string) {
  return db.userBadges
    .filter((entry) => entry.userId === userId)
    .map((entry) => {
      const badge = db.badges.find((candidate) => candidate.key === entry.badgeKey);
      if (!badge) return null;
      return {
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        color: badge.color,
        rarity: badge.rarity,
        earnedAt: entry.earnedAt,
      };
    })
    .filter((badge): badge is NonNullable<typeof badge> => Boolean(badge));
}

// ───────────────────────────── queries ─────────────────────────────

export async function getUserByEmail(email: string) {
  const db = await getDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserAuthData(email: string) {
  const db = await getDb();
  const user = db.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  const role = db.roles.find((candidate) => candidate.id === user.roleId);
  return {
    ...user,
    role: roleLite(role),
    permissions: role?.permissionKeys ?? [],
  };
}

export async function getUserById(id: string) {
  const db = await getDb();
  return db.users.find((user) => user.id === id) ?? null;
}

export async function getMemberLite(userId: string) {
  const db = await getDb();
  return memberLite(db, userId);
}

export async function getPermissionsForUser(userId: string): Promise<string[]> {
  const db = await getDb();
  const user = db.users.find((candidate) => candidate.id === userId);
  if (!user) return [];
  return db.roles.find((role) => role.id === user.roleId)?.permissionKeys ?? [];
}

export async function getMembers(): Promise<MemberView[]> {
  const db = await getDb();
  return db.users
    .filter((user) => !user.email.endsWith("@deleted.local"))
    .map((user) => {
      const role = db.roles.find((candidate) => candidate.id === user.roleId);
      const achievements = db.achievements
        .filter((achievement) => achievement.userId === user.id)
        .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
        .slice(0, 3)
        .map((achievement: Achievement) => ({
          id: achievement.id,
          title: achievement.title,
          points: achievement.points,
          earnedAt: achievement.earnedAt,
          icon: achievement.icon,
        }));

      return {
        id: user.id,
        name: user.name,
        title: user.title,
        avatarHue: user.avatarHue,
        role: roleLite(role),
        email: user.email,
        phone: user.phone,
        location: user.location,
        bio: user.bio,
        skills: user.skills,
        department: user.department,
        points: user.points,
        level: user.level,
        status: user.status,
        joinedAt: user.joinedAt,
        lastActiveAt: user.lastActiveAt,
        stats: memberStats(db, user),
        badges: badgeLites(db, user.id),
        recentAchievements: achievements,
      } satisfies MemberView;
    })
    .sort((a, b) => b.role.level - a.role.level || b.points - a.points);
}

export async function getMember(id: string): Promise<MemberView | null> {
  const members = await getMembers();
  return members.find((member) => member.id === id) ?? null;
}

export async function getProjects(): Promise<ProjectView[]> {
  const db = await getDb();
  const order: Record<string, number> = { ACTIVE: 0, PLANNING: 1, ON_HOLD: 2, COMPLETED: 3, ARCHIVED: 4 };

  return db.projects
    .map((project) => {
      const tasks = projectTasks(db, project.id);
      const done = tasks.filter((task) => task.status === "DONE").length;
      const overdue = tasks.filter(
        (task) => task.status !== "DONE" && task.dueDate && daysLeft(task.dueDate) < 0,
      ).length;
      const owner = requireMember(db, project.ownerId);

      return {
        id: project.id,
        code: project.code,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        progress: projectProgress(project, tasks),
        budget: project.budget,
        spent: project.spent,
        color: project.color,
        tags: project.tags,
        startDate: project.startDate,
        dueDate: project.dueDate,
        owner,
        members: project.members.map((member) => ({
          ...requireMember(db, member.userId),
          projectRole: member.role,
        })),
        milestones: db.milestones
          .filter((milestone) => milestone.projectId === project.id)
          .sort((a, b) => a.order - b.order),
        taskTotal: tasks.length,
        taskDone: done,
        taskOverdue: overdue,
        daysLeft: daysLeft(project.dueDate),
        comments: buildCommentTree(db, "project", project.id),
        openTasks: tasks
          .filter((task) => task.status !== "DONE")
          .slice(0, 6)
          .map((task) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            assigneeName: memberLite(db, task.assigneeId)?.name ?? null,
          })),
      } satisfies ProjectView;
    })
    .sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.daysLeft - b.daysLeft);
}

export async function getProject(id: string): Promise<ProjectView | null> {
  const projects = await getProjects();
  return projects.find((project) => project.id === id || project.code === id) ?? null;
}

export async function getTasks(): Promise<TaskView[]> {
  const db = await getDb();
  return db.tasks
    .map((task) => taskView(db, task))
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export async function getTask(id: string): Promise<TaskView | null> {
  const tasks = await getTasks();
  return tasks.find((task) => task.id === id) ?? null;
}

export async function getProposals(viewerId: string): Promise<ProposalView[]> {
  const db = await getDb();
  const scored = db.proposals.map((proposal) => proposalView(db, proposal, viewerId));
  scored.sort((a, b) => b.score - a.score);
  return scored.map((proposal, index) => ({ ...proposal, rank: index + 1 }));
}

export async function getProposal(id: string, viewerId: string): Promise<ProposalView | null> {
  const proposals = await getProposals(viewerId);
  return proposals.find((proposal) => proposal.id === id) ?? null;
}

export async function getMeetings(): Promise<MeetingView[]> {
  const db = await getDb();
  return db.meetings
    .map((meeting) => meetingView(db, meeting))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function getLeaderboard(period: "month" | "all" = "all"): Promise<LeaderboardEntry[]> {
  const db = await getDb();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const rows = db.users.map((user) => {
    const monthly = db.pointTransactions
      .filter((entry) => entry.userId === user.id && new Date(entry.createdAt) >= since)
      .reduce((total, entry) => total + entry.points, 0);
    return {
      member: requireMember(db, user.id),
      points: period === "month" ? monthly : user.points,
      level: user.level,
      delta: monthly,
      achievements: db.achievements.filter((achievement) => achievement.userId === user.id).length,
    };
  });

  return rows
    .sort((a, b) => b.points - a.points)
    .map((row, index) => ({ rank: index + 1, ...row }));
}

export async function getBadges(): Promise<BadgeView[]> {
  const db = await getDb();
  return db.badges.map((badge) => ({
    key: badge.key,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    color: badge.color,
    rarity: badge.rarity,
    holders: db.userBadges.filter((entry) => entry.badgeKey === badge.key).length,
  }));
}

export async function getAchievements(limit = 20): Promise<AchievementView[]> {
  const db = await getDb();
  return db.achievements
    .map((achievement) => ({
      id: achievement.id,
      member: requireMember(db, achievement.userId),
      title: achievement.title,
      description: achievement.description,
      points: achievement.points,
      icon: achievement.icon,
      rarity: achievement.rarity,
      earnedAt: achievement.earnedAt,
    }))
    .sort((a, b) => b.earnedAt.localeCompare(a.earnedAt))
    .slice(0, limit);
}

export async function getArticles(): Promise<ArticleView[]> {
  const db = await getDb();
  return db.articles
    .map((article) => articleView(db, article))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function articleView(db: Database, article: Article): ArticleView {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    tags: article.tags,
    readTime: article.readTime,
    views: article.views,
    author: requireMember(db, article.authorId),
    publishedAt: article.publishedAt,
    status: article.status,
  };
}

export async function getArticle(slug: string): Promise<ArticleView | null> {
  const db = await getDb();
  const article = db.articles.find((candidate) => candidate.slug === slug);
  return article ? articleView(db, article) : null;
}

export async function getFolders() {
  const db = await getDb();
  return db.folders.map((folder) => ({
    ...folder,
    fileCount: db.assets.filter((asset) => asset.folderId === folder.id).length,
  }));
}

export async function getAssets(): Promise<AssetView[]> {
  const db = await getDb();
  return db.assets
    .map((asset: Asset) => ({
      id: asset.id,
      name: asset.name,
      kind: asset.kind,
      size: asset.size,
      color: asset.color,
      folderId: asset.folderId,
      projectName: db.projects.find((project) => project.id === asset.projectId)?.name ?? null,
      uploader: requireMember(db, asset.uploaderId),
      createdAt: asset.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getChannels(): Promise<ChannelView[]> {
  const db = await getDb();
  return db.channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description,
    icon: channel.icon,
    isPrivate: channel.isPrivate,
    memberCount: channel.memberIds.length,
    messages: db.messages
      .filter((message) => message.channelId === channel.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((message) => ({
        id: message.id,
        body: message.body,
        author: requireMember(db, message.authorId),
        createdAt: message.createdAt,
      })),
  }));
}

export async function getAnnouncements(): Promise<AnnouncementView[]> {
  const db = await getDb();
  return db.announcements
    .map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      pinned: announcement.pinned,
      priority: announcement.priority,
      author: requireMember(db, announcement.authorId),
      createdAt: announcement.createdAt,
    }))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
}

export async function getNotifications(userId: string): Promise<NotificationView[]> {
  const db = await getDb();
  return db.notifications
    .filter((notification) => notification.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      href: notification.href,
      read: notification.read,
      createdAt: notification.createdAt,
    }));
}

export async function getAuditLog(limit = 40): Promise<AuditEntryView[]> {
  const db = await getDb();
  return db.auditLogs
    .map((log) => ({
      id: log.id,
      actor: memberLite(db, log.actorId),
      action: log.action,
      entityType: log.entityType,
      summary: log.summary,
      createdAt: log.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getRoles(): Promise<RoleView[]> {
  const db = await getDb();
  return db.roles
    .map((role) => ({
      id: role.id,
      name: role.name,
      nameEn: role.nameEn,
      description: role.description,
      color: role.color,
      icon: role.icon,
      level: role.level,
      isSystem: role.isSystem,
      userCount: db.users.filter((user) => user.roleId === role.id).length,
      permissions: role.permissionKeys,
    }))
    .sort((a, b) => b.level - a.level);
}

export async function getSettings() {
  const db = await getDb();
  return db.settings;
}

export async function getInvitations() {
  const db = await getDb();
  return db.invitations.map((invitation) => ({
    ...invitation,
    roleName: db.roles.find((role) => role.id === invitation.roleId)?.name ?? "—",
    inviterName: db.users.find((user) => user.id === invitation.invitedById)?.name ?? "—",
  }));
}

// ───────────────────────────── dashboard ─────────────────────────────

function buildTrends(db: Database) {
  const now = new Date();
  const weeks: TrendPoint[] = [];
  const baselineVelocity = [14, 19, 17, 24, 21, 29, 26, 33];
  const baselineDelivery = [58, 63, 61, 69, 72, 74, 77, 82];

  for (let index = 7; index >= 0; index -= 1) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - index * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const completedInWeek = db.tasks.filter((task) => {
      if (!task.completedAt) return false;
      const date = new Date(task.completedAt);
      return date >= weekStart && date <= weekEnd;
    }).length;

    const createdInWeek = db.tasks.filter((task) => {
      const date = new Date(task.createdAt);
      return date >= weekStart && date <= weekEnd;
    }).length;

    weeks.push({
      label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      value: Math.max(baselineVelocity[7 - index] ?? 0, completedInWeek + createdInWeek),
      secondary: baselineDelivery[7 - index] ?? 0,
    });
  }
  return weeks;
}

export async function getDashboard(userId: string): Promise<DashboardView> {
  const db = await getDb();
  const user = db.users.find((candidate) => candidate.id === userId) ?? db.users[0];
  const member = requireMember(db, user.id);
  const role = db.roles.find((candidate) => candidate.id === user.roleId);
  const permissions = role?.permissionKeys ?? [];

  const tasks = await getTasks();
  const projects = await getProjects();
  const meetings = await getMeetings();
  const notifications = await getNotifications(userId);
  const leaderboard = await getLeaderboard();

  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const overdue = openTasks.filter((task) => task.dueDate && daysLeft(task.dueDate) < 0);
  const activeProjects = projects.filter((project) => project.status === "ACTIVE");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

  const attendanceRecords = meetings.flatMap((meeting) =>
    meeting.attendance.filter((record) => record.status !== undefined),
  );
  const attended = attendanceRecords.filter(
    (record) => record.status === "PRESENT" || record.status === "LATE",
  ).length;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const pointsThisMonth = db.pointTransactions
    .filter((entry) => new Date(entry.createdAt) >= monthStart)
    .reduce((total, entry) => total + entry.points, 0);

  const myTasks = tasks
    .filter((task) => task.assignee?.id === userId && task.status !== "DONE")
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));

  const upcomingDeadlines = openTasks
    .filter((task) => task.dueDate && daysLeft(task.dueDate) <= 7)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 5);

  const upcomingMeetings = meetings
    .filter((meeting) => meeting.status === "SCHEDULED" && new Date(meeting.startsAt).getTime() > Date.now() - 3_600_000)
    .slice(0, 3);

  const activity: ActivityItem[] = db.auditLogs
    .map((log) => ({
      id: log.id,
      actor: memberLite(db, log.actorId),
      action: log.action,
      summary: log.summary,
      createdAt: log.createdAt,
      entityType: log.entityType,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);

  const proposals = await getProposals(userId);
  const topProposals = proposals
    .filter((proposal) => ["NEW", "UNDER_REVIEW", "ACCEPTED"].includes(proposal.status))
    .slice(0, 3);

  const recentAchievements = (await getAchievements(4)) as AchievementView[];

  const teamPulse = db.users
    .filter((candidate) => candidate.status === "ACTIVE")
    .map((candidate) => {
      const assigned = tasks.filter((task) => task.assignee?.id === candidate.id && task.status !== "DONE").length;
      return {
        member: requireMember(db, candidate.id),
        tasks: assigned,
        load: clamp(assigned * 16, 8, 100),
      };
    })
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 6);

  return {
    me: { ...member, points: user.points, level: user.level, permissions },
    stats: {
      members: db.users.filter((candidate) => candidate.status === "ACTIVE").length,
      activeProjects: activeProjects.length,
      openTasks: openTasks.length,
      overdueTasks: overdue.length,
      proposals: proposals.filter((proposal) => proposal.status !== "REJECTED").length,
      completionRate: tasks.length === 0 ? 0 : Math.round((doneTasks.length / tasks.length) * 100),
      attendanceRate:
        attendanceRecords.length === 0 ? 0 : Math.round((attended / attendanceRecords.length) * 100),
      pointsThisMonth,
    },
    trends: {
      velocity: buildTrends(db),
      workload: [
        { label: "حرجة", value: openTasks.filter((task) => task.priority === "CRITICAL").length },
        { label: "عالية", value: openTasks.filter((task) => task.priority === "HIGH").length },
        { label: "متوسطة", value: openTasks.filter((task) => task.priority === "MEDIUM").length },
        { label: "منخفضة", value: openTasks.filter((task) => task.priority === "LOW").length },
      ],
      delivery: projects
        .filter((project) => project.status !== "ARCHIVED")
        .slice(0, 5)
        .map((project) => ({ label: project.code, value: project.progress })),
    },
    myTasks,
    activeProjects,
    upcomingDeadlines,
    upcomingMeetings,
    activity,
    topProposals,
    leaderboard,
    recentAchievements,
    teamPulse,
    notifications: notifications.slice(0, 6),
  };
}

// ───────────────────────────── reports ─────────────────────────────

export async function getReportData() {
  const db = await getDb();
  const members = await getMembers();
  const projects = await getProjects();
  const proposals = await getProposals("u_ahmed");

  const memberPerformance = members.map((member) => {
    const tasks = db.tasks.filter((task) => task.assigneeId === member.id);
    const done = tasks.filter((task) => task.status === "DONE").length;
    const hours = db.timeEntries
      .filter((entry) => entry.userId === member.id)
      .reduce((total, entry) => total + entry.minutes, 0) / 60;
    return {
      id: member.id,
      name: member.name,
      avatarHue: member.avatarHue,
      role: member.role.name,
      roleColor: member.role.color,
      tasksDone: done,
      tasksOpen: tasks.length - done,
      hours: Math.round(hours * 10) / 10,
      attendance: member.stats.attendanceRate,
      points: member.points,
      efficiency: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
    };
  });

  const funnel = ["NEW", "UNDER_REVIEW", "ACCEPTED", "CONVERTED", "REJECTED"].map((status) => ({
    status,
    count: proposals.filter((proposal) => proposal.status === status).length,
  }));

  const budget = projects
    .filter((project) => project.status !== "ARCHIVED")
    .map((project) => ({
      name: project.name,
      code: project.code,
      color: project.color,
      budget: project.budget,
      spent: project.spent,
      progress: project.progress,
    }));

  const attendanceByMeeting = db.meetings
    .filter((meeting) => meeting.attendance.length > 0)
    .map((meeting) => ({
      name: new Date(meeting.startsAt).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
      present: meeting.attendance.filter((record) => record.status === "PRESENT").length,
      late: meeting.attendance.filter((record) => record.status === "LATE").length,
      absent: meeting.attendance.filter((record) => record.status === "ABSENT").length,
      excused: meeting.attendance.filter((record) => record.status === "EXCUSED").length,
    }));

  return {
    memberPerformance,
    projects,
    funnel,
    budget,
    attendanceByMeeting,
    totals: {
      members: members.length,
      projects: projects.length,
      tasksDone: db.tasks.filter((task) => task.status === "DONE").length,
      tasksOpen: db.tasks.filter((task) => task.status !== "DONE").length,
      proposals: proposals.length,
      acceptanceRate:
        proposals.length === 0
          ? 0
          : Math.round(
              (proposals.filter((proposal) => ["ACCEPTED", "CONVERTED"].includes(proposal.status)).length /
                proposals.length) *
                100,
            ),
      budget: projects.reduce((total, project) => total + project.budget, 0),
      spent: projects.reduce((total, project) => total + project.spent, 0),
    },
  };
}

// ───────────────────────────── search ─────────────────────────────

export interface SearchItem {
  id: string;
  type: "project" | "task" | "member" | "proposal" | "article" | "meeting" | "page";
  title: string;
  subtitle: string;
  href: string;
  color: string;
}

export async function getSearchIndex(): Promise<SearchItem[]> {
  const db = await getDb();
  const items: SearchItem[] = [];

  for (const project of db.projects) {
    items.push({
      id: project.id,
      type: "project",
      title: project.name,
      subtitle: `${project.code} · ${project.status}`,
      href: `/projects/${project.id}`,
      color: project.color,
    });
  }
  for (const task of db.tasks) {
    items.push({
      id: task.id,
      type: "task",
      title: task.title,
      subtitle: `مهمة · ${task.status}`,
      href: `/tasks?focus=${task.id}`,
      color: "#22D3EE",
    });
  }
  for (const user of db.users) {
    items.push({
      id: user.id,
      type: "member",
      title: user.name,
      subtitle: user.title,
      href: `/members/${user.id}`,
      color: `hsl(${user.avatarHue} 85% 62%)`,
    });
  }
  for (const proposal of db.proposals) {
    items.push({
      id: proposal.id,
      type: "proposal",
      title: proposal.title,
      subtitle: `اقتراح · ${proposal.category}`,
      href: `/proposals?focus=${proposal.id}`,
      color: "#A78BFA",
    });
  }
  for (const article of db.articles) {
    items.push({
      id: article.id,
      type: "article",
      title: article.title,
      subtitle: `مقال · ${article.category}`,
      href: `/knowledge/${article.slug}`,
      color: "#F5C451",
    });
  }
  for (const meeting of db.meetings) {
    items.push({
      id: meeting.id,
      type: "meeting",
      title: meeting.title,
      subtitle: `اجتماع · ${new Date(meeting.startsAt).toLocaleDateString("ar-EG")}`,
      href: `/meetings?focus=${meeting.id}`,
      color: "#FB7185",
    });
  }

  return items;
}
