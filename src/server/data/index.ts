import { roles, users } from "./core";
import { milestones, projects } from "./projects";
import { subtasks, taskDependencies, tasks, timeEntries } from "./tasks";
import { comments, proposalVotes, proposals } from "./proposals";
import { meetings } from "./meetings";
import { achievements, badges, pointTransactions, userBadges } from "./gamification";
import { articles, assets, folders } from "./content";
import {
  announcements,
  auditLogs,
  channels,
  invitations,
  messages,
  notifications,
  settings,
} from "./comms";
import type { Database } from "./types";

export function createDatabase(): Database {
  return {
    version: 1,
    seededAt: new Date().toISOString(),
    roles,
    users,
    projects,
    milestones,
    tasks,
    subtasks,
    timeEntries,
    taskDependencies,
    proposals,
    proposalVotes,
    comments,
    meetings,
    achievements,
    badges,
    userBadges,
    pointTransactions,
    articles,
    folders,
    assets,
    channels,
    messages,
    announcements,
    notifications,
    auditLogs,
    invitations,
    settings,
  };
}

export type { Database } from "./types";
