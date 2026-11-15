import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/server/guard";
import { getProject, getTasks } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { ProjectDetail } from "@/components/projects/project-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await getProject(id);
  return { title: project?.name ?? "مشروع" };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("projects.view");
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const tasks = (await getTasks()).filter((task) => task.project?.id === project.id);

  return (
    <ProjectDetail
      project={project}
      tasks={tasks}
      canArchive={hasPermission(user.permissions, "projects.archive")}
      canComment={hasPermission(user.permissions, "tasks.view")}
    />
  );
}
