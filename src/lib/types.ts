import type {
  ArticleStatus,
  AttendanceStatus,
  AuditAction,
  MemberStatus,
  MeetingStatus,
  NotificationType,
  Priority,
  ProjectStatus,
  ProposalStatus,
  TaskStatus,
} from "@/server/data/types";

export type {
  ArticleStatus,
  AttendanceStatus,
  AuditAction,
  MemberStatus,
  MeetingStatus,
  NotificationType,
  Priority,
  ProjectStatus,
  ProposalStatus,
  TaskStatus,
};

export interface RoleLite {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  icon: string;
  level: number;
}

export interface MemberLite {
  id: string;
  name: string;
  title: string;
  avatarHue: number;
  role: RoleLite;
}

export interface BadgeLite {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedAt: string;
}

export interface MemberStats {
  projects: number;
  tasksDone: number;
  tasksOpen: number;
  attendanceRate: number;
  achievements: number;
  points: number;
}

export interface MemberView extends MemberLite {
  email: string;
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  department: string;
  points: number;
  level: number;
  status: MemberStatus;
  joinedAt: string;
  lastActiveAt: string;
  stats: MemberStats;
  badges: BadgeLite[];
  recentAchievements: { id: string; title: string; points: number; earnedAt: string; icon: string }[];
}

export interface MilestoneView {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
}

export interface TaskLite {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  assigneeName: string | null;
}

export interface TaskView {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  project: { id: string; name: string; code: string; color: string } | null;
  assignee: MemberLite | null;
  creator: MemberLite | null;
  dueDate: string | null;
  estimate: number | null;
  labels: string[];
  subtasks: { id: string; title: string; done: boolean }[];
  doneSubtasks: number;
  timeSpent: number;
  dependencies: { id: string; title: string; status: TaskStatus }[];
  commentsCount: number;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  completedAt: string | null;
  createdAt: string;
  order: number;
}

export interface CommentView {
  id: string;
  body: string;
  author: MemberLite;
  createdAt: string;
  mentions: string[];
  replies: CommentView[];
}

export interface ProjectView {
  id: string;
  code: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  budget: number;
  spent: number;
  color: string;
  tags: string[];
  startDate: string;
  dueDate: string;
  owner: MemberLite;
  members: (MemberLite & { projectRole: string })[];
  milestones: MilestoneView[];
  taskTotal: number;
  taskDone: number;
  taskOverdue: number;
  daysLeft: number;
  comments: CommentView[];
  openTasks: TaskLite[];
}

export interface ProposalView {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ProposalStatus;
  impact: number;
  effort: number;
  difficulty: number;
  score: number;
  upvotes: number;
  downvotes: number;
  myVote: 1 | -1 | 0;
  author: MemberLite;
  createdAt: string;
  projectId: string | null;
  estimatedCost: number;
  resources: string[];
  comments: CommentView[];
  commentCount: number;
  rank: number;
}

export interface MeetingView {
  id: string;
  title: string;
  description: string;
  type: string;
  status: MeetingStatus;
  startsAt: string;
  endsAt: string;
  location: string;
  meetUrl: string | null;
  host: MemberLite;
  project: { id: string; name: string; color: string } | null;
  agenda: { id: string; title: string; duration: number; notes: string }[];
  attendance: { member: MemberLite; status: AttendanceStatus; note?: string }[];
  attendedCount: number;
  totalMembers: number;
  minutes: string;
  durationMinutes: number;
}

export interface LeaderboardEntry {
  rank: number;
  member: MemberLite;
  points: number;
  level: number;
  delta: number;
  achievements: number;
}

export interface BadgeView {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  holders: number;
}

export interface AchievementView {
  id: string;
  member: MemberLite;
  title: string;
  description: string;
  points: number;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  earnedAt: string;
}

export interface ArticleView {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  readTime: number;
  views: number;
  author: MemberLite;
  publishedAt: string;
  status: ArticleStatus;
}

export interface AssetView {
  id: string;
  name: string;
  kind: "document" | "image" | "video" | "archive" | "design" | "link";
  size: number;
  color: string;
  folderId: string | null;
  projectName: string | null;
  uploader: MemberLite;
  createdAt: string;
}

export interface MessageView {
  id: string;
  body: string;
  author: MemberLite;
  createdAt: string;
}

export interface ChannelView {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPrivate: boolean;
  memberCount: number;
  messages: MessageView[];
}

export interface AnnouncementView {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  priority: Priority;
  author: MemberLite;
  createdAt: string;
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
}

export interface AuditEntryView {
  id: string;
  actor: MemberLite | null;
  action: AuditAction;
  entityType: string;
  summary: string;
  createdAt: string;
}

export interface RoleView extends RoleLite {
  description: string;
  nameEn: string;
  isSystem: boolean;
  userCount: number;
  permissions: string[];
}

export interface DashboardStats {
  members: number;
  activeProjects: number;
  openTasks: number;
  overdueTasks: number;
  proposals: number;
  completionRate: number;
  attendanceRate: number;
  pointsThisMonth: number;
}

export interface TrendPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface ActivityItem {
  id: string;
  actor: MemberLite | null;
  action: AuditAction;
  summary: string;
  createdAt: string;
  entityType: string;
}

export interface DashboardView {
  me: MemberLite & { points: number; level: number; permissions: string[] };
  stats: DashboardStats;
  trends: {
    velocity: TrendPoint[];
    workload: TrendPoint[];
    delivery: TrendPoint[];
  };
  myTasks: TaskView[];
  activeProjects: ProjectView[];
  upcomingDeadlines: TaskView[];
  upcomingMeetings: MeetingView[];
  activity: ActivityItem[];
  topProposals: ProposalView[];
  leaderboard: LeaderboardEntry[];
  recentAchievements: AchievementView[];
  teamPulse: { member: MemberLite; tasks: number; load: number }[];
  notifications: NotificationView[];
}

export interface ChannelMessagePayload {
  channelId: string;
  body: string;
}
