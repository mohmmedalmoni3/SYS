"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Lightbulb,
  MessageSquare,
  Plus,
  Rocket,
  Search,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CommentView, ProposalView } from "@/lib/types";
import { PROPOSAL_STATUS_META, cn, formatCurrency, relativeTime } from "@/lib/utils";
import { addComment, convertProposalToProject, createProposal, updateProposalStatus, voteProposal } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { Reveal } from "@/components/fx/reveal";
import { useConfetti } from "@/hooks/use-confetti";

const STATUS_TABS = [
  { key: "ALL", label: "الكل" },
  { key: "NEW", label: "جديد" },
  { key: "UNDER_REVIEW", label: "قيد المراجعة" },
  { key: "ACCEPTED", label: "مقبول" },
  { key: "CONVERTED", label: "تحوّل لمشروع" },
  { key: "REJECTED", label: "مرفوض" },
];

function CommentThread({ comment, depth = 0 }: { comment: CommentView; depth?: number }) {
  return (
    <div className={cn("space-y-2", depth > 0 && "ms-5 border-s border-line ps-3")}>
      <div className="flex gap-2">
        <Avatar name={comment.author.name} hue={comment.author.avatarHue} size="xs" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.66rem] font-medium">{comment.author.name}</span>
            <span className="mono text-[0.48rem] text-muted">{relativeTime(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-[0.66rem] leading-relaxed text-fg/85">{comment.body}</p>
        </div>
      </div>
      {comment.replies.map((reply) => (
        <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  );
}

export function ProposalsView({
  proposals,
  categories,
  canCreate,
  canVote,
  canReview,
  canConvert,
}: {
  proposals: ProposalView[];
  categories: string[];
  canCreate: boolean;
  canVote: boolean;
  canReview: boolean;
  canConvert: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<"score" | "new" | "votes">("score");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ProposalView | null>(null);
  const [pending, startTransition] = useTransition();
  const { fire } = useConfetti();
  const [votes, setVotes] = useState<Record<string, { myVote: number; up: number; down: number }>>(() =>
    Object.fromEntries(proposals.map((proposal) => [proposal.id, { myVote: proposal.myVote, up: proposal.upvotes, down: proposal.downvotes }])),
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = proposals.filter((proposal) => {
      if (status !== "ALL" && proposal.status !== status) return false;
      if (category !== "ALL" && proposal.category !== category) return false;
      if (!normalized) return true;
      return proposal.title.toLowerCase().includes(normalized) || proposal.description.toLowerCase().includes(normalized);
    });
    return list.sort((a, b) => {
      if (sort === "new") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "votes") return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
      return b.score - a.score;
    });
  }, [proposals, status, category, query, sort]);

  const topAuthors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; hue: number; color: string; count: number; votes: number }>();
    for (const proposal of proposals) {
      const existing = map.get(proposal.author.id);
      const votesCount = proposal.upvotes - proposal.downvotes;
      if (existing) {
        existing.count += 1;
        existing.votes += votesCount;
      } else {
        map.set(proposal.author.id, {
          id: proposal.author.id,
          name: proposal.author.name,
          hue: proposal.author.avatarHue,
          color: proposal.author.role.color,
          count: 1,
          votes: votesCount,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.votes - a.votes || b.count - a.count).slice(0, 5);
  }, [proposals]);

  function vote(proposal: ProposalView, value: 1 | -1) {
    if (!canVote) return;
    const current = votes[proposal.id] ?? { myVote: 0, up: proposal.upvotes, down: proposal.downvotes };
    const nextVote = current.myVote === value ? 0 : value;
    let up = current.up;
    let down = current.down;
    if (current.myVote === 1) up -= 1;
    if (current.myVote === -1) down -= 1;
    if (nextVote === 1) up += 1;
    if (nextVote === -1) down += 1;

    setVotes((state) => ({ ...state, [proposal.id]: { myVote: nextVote, up, down } }));
    startTransition(async () => {
      try {
        await voteProposal({ proposalId: proposal.id, value: nextVote === 0 ? value : nextVote, reason: "" });
        router.refresh();
      } catch (error) {
        setVotes((state) => ({ ...state, [proposal.id]: current }));
        toast.error(error instanceof Error ? error.message : "تعذّر تسجيل التصويت");
      }
    });
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        await createProposal({
          title: String(formData.get("title") ?? ""),
          description: String(formData.get("description") ?? ""),
          category: String(formData.get("category") ?? ""),
          impact: Number(formData.get("impact") ?? 3),
          effort: Number(formData.get("effort") ?? 3),
          difficulty: Number(formData.get("difficulty") ?? 3),
          estimatedCost: Number(formData.get("estimatedCost") ?? 0),
          resources: String(formData.get("resources") ?? ""),
        });
        toast.success("شكراً! أُضيف اقتراحك");
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إضافة الاقتراح");
      }
    });
  }

  function review(proposal: ProposalView, next: "UNDER_REVIEW" | "ACCEPTED" | "REJECTED") {
    startTransition(async () => {
      try {
        await updateProposalStatus(proposal.id, next);
        toast.success("حدّثت حالة الاقتراح");
        if (next === "ACCEPTED") fire({ count: 60 });
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر التحديث");
      }
    });
  }

  function convert(proposal: ProposalView) {
    startTransition(async () => {
      try {
        const result = await convertProposalToProject(proposal.id);
        fire({ count: 110 });
        toast.success("تحوّل الاقتراح إلى مشروع 🚀");
        router.push(`/projects/${result.projectId}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر التحويل");
      }
    });
  }

  const stats = [
    { label: "إجمالي الاقتراحات", value: proposals.length, color: "#A78BFA" },
    { label: "قيد المراجعة", value: proposals.filter((proposal) => proposal.status === "UNDER_REVIEW").length, color: "#FBBF24" },
    { label: "تحوّلت لمشاريع", value: proposals.filter((proposal) => proposal.status === "CONVERTED").length, color: "#34D399" },
    { label: "متوسط النقاط", value: proposals.length ? Math.round(proposals.reduce((sum, proposal) => sum + proposal.score, 0) / proposals.length) : 0, color: "#22D3EE" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="PROPOSALS · 04"
        title="بنك الأفكار"
        description="أي عضو يقدّم فكرة، والفريق يصوّت ويحسّن، وأفضل الأفكار تتحول إلى مشاريع."
        actions={
          canCreate ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-shimmer">
                  <Plus className="size-3.5" />
                  اقتراح جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[min(94vw,640px)]">
                <DialogHeader>
                  <DialogTitle>تقديم اقتراح</DialogTitle>
                  <DialogDescription>كن محدداً: ما الفكرة؟ ما أثرها؟ وما الموارد التي تحتاجها؟</DialogDescription>
                </DialogHeader>
                <form action={submit} className="space-y-3">
                  <Field label="عنوان الاقتراح">
                    <Input name="title" required minLength={6} placeholder="فكرة بجملة واحدة واضحة" />
                  </Field>
                  <Field label="الوصف">
                    <Textarea name="description" required minLength={20} rows={4} placeholder="اشرح المشكلة، الحل المقترح، والأثر المتوقع…" />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="الفئة">
                      <Select name="category" defaultValue={categories[0]}>
                        {categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="التكلفة التقديرية (ر.س)">
                      <Input name="estimatedCost" type="number" min={0} step={500} defaultValue={0} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: "impact", label: "الأثر (1-5)", value: 5 },
                      { name: "effort", label: "الجهد (1-5)", value: 3 },
                      { name: "difficulty", label: "الصعوبة (1-5)", value: 3 },
                    ].map((slider) => (
                      <Field key={slider.name} label={slider.label}>
                        <Input name={slider.name} type="range" min={1} max={5} step={1} defaultValue={slider.value} className="field h-9 py-0" />
                      </Field>
                    ))}
                  </div>
                  <Field label="الموارد المطلوبة" hint="افصل بينها بفاصلة">
                    <Input name="resources" placeholder="مهندس خلفية، تصميم، ميزانية…" />
                  </Field>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" size="sm" loading={pending}>
                      نشر الاقتراح
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-3.5">
            <div className="num text-xl font-semibold" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="mt-0.5 text-[0.58rem] text-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_270px]">
        <div className="space-y-3">
          <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-2">
            <div className="relative min-w-40 flex-1">
              <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-3.5 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث في الاقتراحات…" className="field h-9 ps-9 text-xs" />
            </div>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="field h-9 w-auto py-0 text-xs">
              <option value="ALL">كل الفئات</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="field h-9 w-auto py-0 text-xs">
              <option value="score">الأعلى نقاطاً</option>
              <option value="new">الأحدث</option>
              <option value="votes">الأكثر تصويتاً</option>
            </select>
          </div>

          <Tabs value={status} onValueChange={setStatus}>
            <TabsList className="w-full flex-wrap justify-start">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="glass rounded-[var(--radius)] p-12 text-center text-sm text-muted">لا اقتراحات مطابقة.</div>
            ) : (
              filtered.map((proposal, index) => {
                const voteState = votes[proposal.id] ?? { myVote: proposal.myVote, up: proposal.upvotes, down: proposal.downvotes };
                return (
                  <Reveal key={proposal.id} delay={index * 0.03}>
                    <SpotlightCard className="p-4">
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <ProgressRing
                            value={proposal.score}
                            size={52}
                            stroke={4}
                            color={proposal.score > 75 ? "#34D399" : proposal.score > 50 ? "#22D3EE" : "#FBBF24"}
                          >
                            <span className="num text-[0.68rem] font-semibold">{proposal.score}</span>
                          </ProgressRing>
                          <span className="text-[0.45rem] text-muted">نقاط</span>
                          <span className="mono mt-1 text-[0.5rem] text-muted">#{proposal.rank}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <StatusBadge status={proposal.status} />
                                <Badge className="text-[0.5rem]">{proposal.category}</Badge>
                              </div>
                              <h3 className="mt-1.5 font-display text-[0.88rem] font-semibold leading-relaxed">{proposal.title}</h3>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={!canVote}
                                onClick={() => vote(proposal, 1)}
                                className={cn(
                                  "flex items-center gap-1 rounded-lg border px-2 py-1 text-[0.6rem] transition",
                                  voteState.myVote === 1
                                    ? "border-success/40 bg-success/10 text-success"
                                    : "border-line text-muted hover:text-fg",
                                )}
                                aria-label="تصويت إيجابي"
                              >
                                <ThumbsUp className="size-3" />
                                <span className="num">{voteState.up}</span>
                              </button>
                              <button
                                type="button"
                                disabled={!canVote}
                                onClick={() => vote(proposal, -1)}
                                className={cn(
                                  "flex items-center gap-1 rounded-lg border px-2 py-1 text-[0.6rem] transition",
                                  voteState.myVote === -1
                                    ? "border-danger/40 bg-danger/10 text-danger"
                                    : "border-line text-muted hover:text-fg",
                                )}
                                aria-label="تصويت سلبي"
                              >
                                <ThumbsDown className="size-3" />
                                <span className="num">{voteState.down}</span>
                              </button>
                            </div>
                          </div>

                          <p className="mt-2 line-clamp-2 text-[0.66rem] leading-relaxed text-muted">{proposal.description}</p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[0.55rem] text-muted">
                            <span className="flex items-center gap-1">
                              <Avatar name={proposal.author.name} hue={proposal.author.avatarHue} size="xs" />
                              {proposal.author.name}
                            </span>
                            <span className="flex items-center gap-1"><Flame className="size-3 text-warning" /> أثر {proposal.impact}/5</span>
                            <span>جهد {proposal.effort}/5</span>
                            <span>صعوبة {proposal.difficulty}/5</span>
                            <span className="mono">{formatCurrency(proposal.estimatedCost)}</span>
                            <button type="button" onClick={() => setDetail(proposal)} className="flex items-center gap-1 text-primary-soft hover:underline">
                              <MessageSquare className="size-3" /> {proposal.commentCount}
                            </button>
                          </div>

                          {(canReview || (canConvert && proposal.status === "ACCEPTED")) ? (
                            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                              {canReview && proposal.status === "NEW" ? (
                                <Button size="sm" variant="ghost" onClick={() => review(proposal, "UNDER_REVIEW")} disabled={pending}>
                                  بدء المراجعة
                                </Button>
                              ) : null}
                              {canReview && proposal.status === "UNDER_REVIEW" ? (
                                <>
                                  <Button size="sm" variant="success" onClick={() => review(proposal, "ACCEPTED")} disabled={pending}>
                                    <Check className="size-3" /> قبول
                                  </Button>
                                  <Button size="sm" variant="danger" onClick={() => review(proposal, "REJECTED")} disabled={pending}>
                                    <X className="size-3" /> رفض
                                  </Button>
                                </>
                              ) : null}
                              {canConvert && proposal.status === "ACCEPTED" ? (
                                <Button size="sm" variant="primary" onClick={() => convert(proposal)} disabled={pending}>
                                  <Rocket className="size-3" /> تحويل إلى مشروع
                                </Button>
                              ) : null}
                              {proposal.projectId ? (
                                <a href={`/projects/${proposal.projectId}`} className="btn btn-ghost h-8 px-2.5 text-[0.65rem]">
                                  المشروع <ArrowUpRight className="size-3" />
                                </a>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </SpotlightCard>
                  </Reveal>
                );
              })
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <SpotlightCard className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="size-4 text-[#F5C451]" />
              <h3 className="font-display text-sm font-semibold">أفضل المقترحين</h3>
            </div>
            <div className="space-y-2">
              {topAuthors.map((author, index) => (
                <div key={author.id} className="flex items-center gap-2">
                  <span className="num w-4 text-[0.58rem] text-muted">{index + 1}</span>
                  <Avatar name={author.name} hue={author.hue} size="xs" ring={author.color} />
                  <span className="min-w-0 flex-1 truncate text-[0.65rem]">{author.name}</span>
                  <span className="num text-[0.55rem] text-muted">{author.votes > 0 ? "+" : ""}{author.votes}</span>
                </div>
              ))}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-primary-soft" />
              <h3 className="font-display text-sm font-semibold">كيف تُحسب النقاط؟</h3>
            </div>
            <p className="text-[0.62rem] leading-relaxed text-muted">
              نبدأ من 20 نقطة، ثم: الأثر ×14، الصعوبة ×4، ناقص الجهد ×6، زائد صافي التصويت ×5. النتيجة من 100.
            </p>
            <div className="mt-3 space-y-1.5 text-[0.6rem] text-muted">
              <div className="flex items-center justify-between"><span>أثر عالٍ</span><span className="text-success">+70</span></div>
              <div className="flex items-center justify-between"><span>جهد كبير</span><span className="text-danger">−30</span></div>
              <div className="flex items-center justify-between"><span>تصويت إيجابي</span><span className="text-primary-soft">+5 / صوت</span></div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="size-4 text-warning" />
              <h3 className="font-display text-sm font-semibold">مسار الاقتراح</h3>
            </div>
            <ol className="space-y-1.5 text-[0.6rem] text-muted">
              {["جديد", "قيد المراجعة", "مقبول / مرفوض", "تحويل إلى مشروع"].map((step, index) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="num grid size-4 place-items-center rounded-full bg-white/5 text-[0.5rem]">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </SpotlightCard>
        </aside>
      </div>

      {detail ? (
        <ProposalDialog
          proposal={detail}
          onClose={() => setDetail(null)}
          onRefresh={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}

function ProposalDialog({ proposal, onClose, onRefresh }: { proposal: ProposalView; onClose: () => void; onRefresh: () => void }) {
  const [pending, startTransition] = useTransition();
  const [comment, setComment] = useState("");

  function submit(formData: FormData) {
    const body = String(formData.get("body") ?? "").trim();
    if (!body) return;
    startTransition(async () => {
      try {
        await addComment({ entityType: "proposal", entityId: proposal.id, body });
        setComment("");
        toast.success("أُضيف التعليق");
        onRefresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "تعذّر إضافة التعليق");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(94vw,640px)]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <StatusBadge status={proposal.status} />
            <Badge>{proposal.category}</Badge>
            <span className="num text-[0.6rem] text-primary-soft">{proposal.score} نقطة</span>
          </div>
          <DialogTitle className="mt-1 leading-relaxed">{proposal.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-line">{proposal.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-[0.6rem]">
          {[
            { label: "الأثر", value: `${proposal.impact}/5` },
            { label: "الجهد", value: `${proposal.effort}/5` },
            { label: "الصعوبة", value: `${proposal.difficulty}/5` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-line px-2 py-1.5">
              <div className="text-[0.5rem] text-muted">{item.label}</div>
              <div className="num mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>

        {proposal.resources.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {proposal.resources.map((resource) => (
              <Badge key={resource} className="text-[0.52rem]">
                {resource}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-4 border-t border-line pt-3">
          <div className="mb-3 flex items-center gap-2 text-[0.68rem] font-medium">
            <MessageSquare className="size-3.5 text-primary-soft" />
            النقاش ({proposal.commentCount})
          </div>
          <div className="max-h-56 space-y-3 overflow-y-auto pe-1">
            {proposal.comments.length === 0 ? (
              <p className="py-3 text-center text-[0.62rem] text-muted">لا تعليقات بعد — ابدأ النقاش.</p>
            ) : (
              proposal.comments.map((item) => <CommentThread key={item.id} comment={item} />)
            )}
          </div>

          <form action={submit} className="mt-3 flex items-end gap-2">
            <textarea
              name="body"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={2}
              placeholder="اكتب رأيك… استخدم @ لذكر عضو"
              className="field flex-1 resize-none"
            />
            <Button type="submit" size="icon" loading={pending} aria-label="إرسال">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
