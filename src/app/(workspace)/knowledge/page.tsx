import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getArticles } from "@/server/repository";
import { KnowledgeView } from "@/components/knowledge/knowledge-view";

export const metadata: Metadata = { title: "مركز المعرفة" };
export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  await requirePermission("knowledge.view");
  const articles = await getArticles();
  return <KnowledgeView articles={articles} />;
}
