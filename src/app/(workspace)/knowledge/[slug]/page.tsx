import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock3, Eye } from "lucide-react";
import { requirePermission } from "@/server/guard";
import { getArticle, getArticles } from "@/server/repository";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SpotlightCard } from "@/components/fx/spotlight-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  return { title: article?.title ?? "مقال", description: article?.excerpt };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  await requirePermission("knowledge.view");
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const related = (await getArticles())
    .filter((item) => item.id !== article.id)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center gap-2 text-[0.65rem] text-muted">
        <Link href="/knowledge" className="flex items-center gap-1 hover:text-fg">
          <ArrowRight className="size-3" />
          مركز المعرفة
        </Link>
        <span>/</span>
        <span className="truncate">{article.category}</span>
      </div>

      <SpotlightCard className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{article.category}</Badge>
          {article.tags.map((tag) => (
            <Badge key={tag} className="text-[0.5rem]">#{tag}</Badge>
          ))}
        </div>
        <h1 className="mt-3 display-page text-balance">{article.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-line py-3 text-[0.62rem] text-muted">
          <span className="flex items-center gap-2">
            <Avatar name={article.author.name} hue={article.author.avatarHue} size="sm" ring={article.author.role.color} />
            <span>
              <span className="block text-[0.68rem] font-medium text-fg">{article.author.name}</span>
              <span className="block text-[0.55rem]">{article.author.title}</span>
            </span>
          </span>
          <span className="flex items-center gap-1"><Clock3 className="size-3" /> {article.readTime} دقائق</span>
          <span className="flex items-center gap-1"><Eye className="size-3" /> <span className="num">{article.views}</span> قراءة</span>
          <span className="mono ms-auto">{formatDate(article.publishedAt, true)}</span>
        </div>

        <article className="tectnal-prose mt-5" dangerouslySetInnerHTML={{ __html: article.content }} />
      </SpotlightCard>

      {related.length > 0 ? (
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold">مقالات ذات صلة</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.id} href={`/knowledge/${item.slug}`}>
                <SpotlightCard className="h-full p-4">
                  <Badge className="text-[0.48rem]">{item.category}</Badge>
                  <h3 className="mt-2 line-clamp-2 text-[0.72rem] font-medium leading-relaxed">{item.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[0.58rem] text-muted">{item.excerpt}</p>
                </SpotlightCard>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
