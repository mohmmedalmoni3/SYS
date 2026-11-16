/**
 * Raw persistence shapes shared by the JSON store and Prisma seed.
 * Dates are ISO strings so the store can be serialized to disk safely.
 */

export type ISO = string;

export type MemberStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "ALUMNI";
export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type ProposalStatus = "NEW" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" | "CONVERTED";
export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "DONE";
export type MeetingStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";
export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "MENTION" | "ASSIGNMENT" | "DEADLINE";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "RANK_CHANGE" | "EXPORT" | "APPROVE" | "REJECT";
export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface Role {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  color: string;
  icon: string;
  level: number;
  isSystem: boolean;
  permissionKeys: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  image: string | null;
  avatarHue: number;
  bio: string;
  title: string;
  department: string;
  phone: string;
  location: string;
  skills: string[];
  points: number;
  level: number;
  status: MemberStatus;
  joinedAt: ISO;
  lastActiveAt: ISO;
  roleId: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  budget: number;
  spent: number;
  color: string;
  tags: string[];
  startDate: ISO;
  dueDate: ISO;
  ownerId: string;
  members: { userId: string; role: string }[];
  createdAt: ISO;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string;
  dueDate: ISO;
  status: MilestoneStatus;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string | null;
  assigneeId: string | null;
  createdById: string;
  meetingId?: string | null;
  dueDate: ISO | null;
  estimate: number | null;
  order: number;
  labels: string[];
  recurrence: "none" | "daily" | "weekly" | "monthly";
  completedAt: ISO | null;
  createdAt: ISO;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  done: boolean;
  order: number;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  minutes: number;
  note: string;
  startedAt: ISO;
  endedAt: ISO | null;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: number;
  effort: number;
  difficulty: number;
  resources: string[];
  estimatedCost: number;
  status: ProposalStatus;
  authorId: string;
  projectId: string | null;
  createdAt: ISO;
}

export interface ProposalVote {
  id: string;
  proposalId: string;
  userId: string;
  value: 1 | -1;
  reason: string;
  createdAt: ISO;
}

export interface Comment {
  id: string;
  entityType: "task" | "project" | "proposal" | "article";
  entityId: string;
  authorId: string;
  body: string;
  parentId: string | null;
  mentions: string[];
  createdAt: ISO;
}

export interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  notes: string;
}

export interface AttendanceRecord {
  userId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  type: string;
  status: MeetingStatus;
  startsAt: ISO;
  endsAt: ISO;
  location: string;
  meetUrl: string | null;
  hostId: string;
  projectId: string | null;
  agenda: AgendaItem[];
  attendance: AttendanceRecord[];
  minutes: string;
  createdAt: ISO;
}

export interface Achievement {
  id: string;
  userId: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedAt: ISO;
  awardedById: string | null;
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface UserBadge {
  userId: string;
  badgeKey: string;
  earnedAt: ISO;
}

export interface PointTransaction {
  id: string;
  userId: string;
  points: number;
  reason: string;
  source: string;
  createdAt: ISO;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number;
  views: number;
  authorId: string;
  status: ArticleStatus;
  publishedAt: ISO;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color: string;
}

export interface Asset {
  id: string;
  name: string;
  kind: "document" | "image" | "video" | "archive" | "design" | "link";
  size: number;
  folderId: string | null;
  projectId: string | null;
  roleId: string | null;
  uploaderId: string;
  createdAt: ISO;
  color: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPrivate: boolean;
  memberIds: string[];
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  body: string;
  createdAt: ISO;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  priority: Priority;
  authorId: string;
  createdAt: ISO;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: ISO;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  summary: string;
  createdAt: ISO;
}

export interface Invitation {
  id: string;
  code: string;
  email: string | null;
  roleId: string;
  invitedById: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: ISO;
  createdAt: ISO;
}

export interface Database {
  version: number;
  seededAt: ISO;
  roles: Role[];
  users: User[];
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  subtasks: Subtask[];
  timeEntries: TimeEntry[];
  taskDependencies: TaskDependency[];
  proposals: Proposal[];
  proposalVotes: ProposalVote[];
  comments: Comment[];
  meetings: Meeting[];
  achievements: Achievement[];
  badges: Badge[];
  userBadges: UserBadge[];
  pointTransactions: PointTransaction[];
  articles: Article[];
  folders: Folder[];
  assets: Asset[];
  channels: Channel[];
  messages: Message[];
  announcements: Announcement[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  invitations: Invitation[];
  settings: Record<string, string | number | boolean>;
}
