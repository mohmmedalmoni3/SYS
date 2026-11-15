"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpLeft, Clock3, Eye, FileText, Search, Sparkles } from "lucide-react";
import type { ArticleView } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/empty-state";
import { SpotlightCard } from "@/components/fx/spotlight-card";

export function KnowledgeView({ articles }: { articles: ArticleView[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const categories = useMemo(() => Array.from(new Set(articles.map((article) => article.category))), [articles]);
  const featured = articles[0];

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (category !== "ALL" && article.category !== category) return false;
      if (!normalized) return true;
      return (
        article.title.toLowerCase().includes(normalized) ||
        article.excerpt.toLowerCase().includes(normalized) ||
        article.tags.some((tag) => tag.toLowerCase().includes(normalized))
      );
    });
  }, [articles, query, category]);

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="KNOWLEDGE · 08"
        title="مركز المعرفة"
        description="أدلة، دروس، وقرارات موثقة — المعرفة التي تجعل الفريق أسرع."
        actions={
          <span className="chip py-1.5">
            <FileText className="size-3" />
            {articles.length} مقالاً
          </span>
        }
      />

      {featured ? (
        <Link href={`/knowledge/${featured.slug}`} className="group block">
          <SpotlightCard className="relative overflow-hidden p-0">
            <div className="grid md:grid-cols-[1.2fr_1fr]">
              <div className="p-6">
                <div className="mb-2 flex items-center gap-2">
                  <Badge tone="primary" className="text-[0.52rem]">
                    <Sparkles className="size-2.5" /> مقال مميز
                  </Badge>
                  <Badge className="text-[0.52rem]">{featured.category}</Badge>
                </div>
                <h2 className="font-display text-xl font-bold leading-snug group-hover:text-primary-soft md:text-2xl">
                  {featured.title}
                </h2>
                <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">{featured.excerpt}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.6rem] text-muted">
                  <span className="flex items-center gap-1.5">
                    <Avatar name={featured.author.name} hue={featured.author.avatarHue} size="xs" />
                    {featured.author.name}
                  </span>
                  <span className="flex items-center gap-1"><Clock3 className="size-3" /> {featured.readTime} دقائق قراءة</span>
                  <span className="flex items-center gap-1"><Eye className="size-3" /> <span className="num">{featured.views}</span></span>
                  <span className="mono">{formatDate(featured.publishedAt)}</span>
                </div>
              </div>
              <div className="relative hidden items-center justify-center overflow-hidden border-s border-line md:flex">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,color-mix(in_oklab,var(--primary)_30%,transparent),transparent_60%)]" />
                <div className="relative grid size-36 place-items-center">
                  <span className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-primary/30" />
                  <span className="absolute inset-5 rounded-full border border-primary-2/25" />
                  <FileText className="size-10 text-primary-soft" />
                </div>
                <span className="kicker absolute bottom-4 end-4 text-[0.5rem]">READ · LEAD · SHARE</span>
              </div>
            </div>
          </SpotlightCard>
        </Link>
      ) : null}

      <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-3.5 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث في المقالات والوسوم…"
            className="field h-9 ps-9 text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            className={cn("rounded-lg px-2.5 py-1 text-[0.6rem] transition", category === "ALL" ? "bg-primary/15 text-fg" : "text-muted hover:text-fg")}
          >
            الكل
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn("rounded-lg px-2.5 py-1 text-[0.6rem] transition", category === item ? "bg-primary/15 text-fg" : "text-muted hover:text-fg")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((article) => (
          <Link key={article.id} href={`/knowledge/${article.slug}`} className="group block">
            <SpotlightCard className="flex h-full flex-col p-4">
              <div
                className="mb-3 h-1.5 w-14 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--primary), var(--primary-2))" }}
              />
              <div className="flex items-center gap-1.5">
                <Badge className="text-[0.48rem]">{article.category}</Badge>
                <span className="mono text-[0.5rem] text-muted">{article.readTime} د</span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-display text-[0.85rem] font-semibold leading-relaxed group-hover:text-primary-soft">
                {article.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 flex-1 text-[0.62rem] leading-relaxed text-muted">{article.excerpt}</p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                <span className="flex items-center gap-1.5 text-[0.55rem] text-muted">
                  <Avatar name={article.author.name} hue={article.author.avatarHue} size="xs" />
                  {article.author.name}
                </span>
                <ArrowUpLeft className="size-3 text-primary-soft opacity-0 transition group-hover:opacity-100" />
              </div>
            </SpotlightCard>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="glass rounded-[var(--radius)] p-12 text-center text-sm text-muted">لا مقالات مطابقة.</div>
      ) : null}
    </div>
  );
}
