import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getMembers, getProjects } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { ProjectsView } from "@/components/projects/projects-view";

export const metadata: Metadata = { title: "المشاريع" };
export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requirePermission("projects.view");
  const [projects, members] = await Promise.all([getProjects(), getMembers()]);

  return (
    <ProjectsView
      projects={projects}
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        title: member.title,
        avatarHue: member.avatarHue,
        role: member.role,
      }))}
      canCreate={hasPermission(user.permissions, "projects.create")}
      canSeeBudget={hasPermission(user.permissions, "projects.budget")}
    />
  );
}
