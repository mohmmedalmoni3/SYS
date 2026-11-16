import { roles } from "./core";
import type { Database } from "./types";

export function createDatabase(): Database {
  return {
    version: 2,
    seededAt: new Date().toISOString(),
    roles,
    users: [],
    projects: [],
    milestones: [],
    tasks: [],
    subtasks: [],
    timeEntries: [],
    taskDependencies: [],
    proposals: [],
    proposalVotes: [],
    comments: [],
    meetings: [],
    achievements: [],
    badges: [],
    userBadges: [],
    pointTransactions: [],
    articles: [],
    folders: [],
    assets: [],
    channels: [],
    messages: [],
    announcements: [],
    notifications: [],
    auditLogs: [],
    invitations: [],
    settings: {
      committeeName: "لجنة التقنية والتحول الرقمي",
      committeeNameEn: "Technology & Digital Transformation Committee",
      tagline: "حيث تُدار الأفكار، وتُنجَز المشاريع، ويُصنَع الأثر.",
      primaryColor: "#7C5CFF",
      accentColor: "#22D3EE",
      warmColor: "#FFB86B",
      logoMark: "ت",
      defaultTheme: "dark",
      allowDiscordLogin: false,
      weeklyDigest: true,
      deadlineReminders: true,
      mentionNotifications: true,
      autoArchiveDays: 90,
      defaultRoleId: "role_trainee",
      fiscalYearStart: "يناير",
    },
  };
}

export type { Database } from "./types";
