import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getMembers, getProjects, getTasks } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { TasksView } from "@/components/tasks/tasks-view";

export const metadata: Metadata = { title: "المهام" };
export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requirePermission("tasks.view");
  const [tasks, projects, members] = await Promise.all([
    getTasks(),
    getProjects(),
    getMembers(),
  ]);

  return (
    <TasksView
      initialTasks={tasks}
      projects={projects
        .filter((project) => project.status !== "ARCHIVED")
        .map((project) => ({ id: project.id, name: project.name, code: project.code }))}
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        title: member.title,
        avatarHue: member.avatarHue,
        role: member.role,
      }))}
      currentUserId={user.id}
      canCreate={hasPermission(user.permissions, "tasks.create")}
    />
  );
}
