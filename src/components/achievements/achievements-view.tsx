"use client";

import { useState } from "react";
import { Crown, Flame, Medal, PartyPopper, Sparkles, Trophy, Zap } from "lucide-react";
import type { AchievementView, BadgeView, LeaderboardEntry } from "@/lib/types";
import { cn, formatNumber, relativeTime } from "@/lib/utils";
import { useConfetti } from "@/hooks/use-confetti";
import { Avatar } from "@/components/ui/avatar";
import { Badge, RarityBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpotlightCard } from "@/components/fx/spotlight-card";
import { BadgeIcon } from "@/lib/icons";

const PODIUM_STYLES = [
  { order: 2, height: "h-28", color: "#CBD5E1", medal: Medal },
  { order: 1, height: "h-36", color: "#F5C451", medal: Crown },
  { order: 3, height: "h-24", color: "#D97706", medal: Medal },
];

export function AchievementsView({
  leaderboardAll,
  leaderboardMonth,
  badges,
  achievements,
  currentUserId,
}: {
  leaderboardAll: LeaderboardEntry[];
  leaderboardMonth: LeaderboardEntry[];
  badges: BadgeView[];
  achievements: AchievementView[];
  currentUserId: string;
}) {
  const [period, setPeriod] = useState<"month" | "all">("all");
  const { fire } = useConfetti();
  const board = period === "month" ? leaderboardMonth : leaderboardAll;
  const podium = [board[1], board[0], board[2]].filter(Boolean);
  const me = board.find((entry) => entry.member.id === currentUserId);

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="ACHIEVEMENTS · 07"
        title="الإنجازات والنقاط"
        description="التقدير ليس شكلياً: كل مساهمة تُحتسب، وكل إنجاز يترك أثراً."
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => fire({ count: 160 })}>
              <PartyPopper className="size-3.5" />
              احتفل
            </Button>
            <Tabs value={period} onValueChange={(value) => setPeriod(value as "month" | "all")}>
              <TabsList>
                <TabsTrigger value="month">هذا الشهر</TabsTrigger>
                <TabsTrigger value="all">كل الوقت</TabsTrigger>
              </TabsList>
            </Tabs>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SpotlightCard className="relative overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_60%)]" />
          <div className="relative flex items-end justify-center gap-3 pt-6">
            {podium.map((entry) => {
              const style = PODIUM_STYLES.find((item) => item.order === entry.rank) ?? PODIUM_STYLES[0];
              const isFirst = entry.rank === 1;
              return (
                <div key={entry.member.id} className="flex w-1/3 flex-col items-center">
                  <div className="relative mb-2">
                    {isFirst ? <Crown className="absolute -top-6 left-1/2 size-5 -translate-x-1/2 text-[#F5C451]" /> : null}
                    <Avatar name={entry.member.name} hue={entry.member.avatarHue} size={isFirst ? "xl" : "lg"} ring={style.color} />
                    <span
                      className="absolute -bottom-1 -end-1 grid size-5 place-items-center rounded-full text-[0.5rem] font-bold text-black"
                      style={{ background: style.color }}
                    >
                      {entry.rank}
                    </span>
                  </div>
                  <div className="max-w-full truncate text-[0.68rem] font-medium">{entry.member.name}</div>
                  <div className="num text-[0.6rem]" style={{ color: style.color }}>
                    {formatNumber(entry.points)}
                  </div>
                  <div
                    className={cn("mt-2 w-full rounded-t-xl border border-b-0 border-line", style.height)}
                    style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${style.color} 18%, transparent), transparent)` }}
                  >
                    <div className="flex h-full flex-col items-center justify-start gap-1 pt-2">
                      <style.medal className="size-3.5" style={{ color: style.color }} />
                      <span className="text-[0.46rem] text-muted">L{entry.level}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {me ? (
            <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-[color-mix(in_oklab,var(--surface)_60%,transparent)] px-3 py-2.5">
              <span className="flex items-center gap-2 text-[0.65rem]">
                <Zap className="size-3.5 text-warning" />
                ترتيبك الحالي <span className="num font-semibold">#{me.rank}</span> · {formatNumber(me.points)} نقطة
              </span>
              <span className="flex items-center gap-1 text-[0.58rem] text-muted">
                <Flame className="size-3 text-danger" /> {me.achievements} إنجاز
              </span>
            </div>
          ) : null}
        </SpotlightCard>

        <div className="space-y-3">
          <SpotlightCard className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="size-4 text-[#F5C451]" />
              <h3 className="font-display text-sm font-semibold">لوحة الصدارة</h3>
            </div>
            <div className="space-y-1.5">
              {board.slice(3, 10).map((entry) => (
                <div
                  key={entry.member.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-1.5 py-1",
                    entry.member.id === currentUserId && "bg-[color-mix(in_oklab,var(--primary)_10%,transparent)]",
                  )}
                >
                  <span className="num w-4 text-[0.55rem] text-muted">{entry.rank}</span>
                  <Avatar name={entry.member.name} hue={entry.member.avatarHue} size="xs" ring={entry.member.role.color} />
                  <span className="min-w-0 flex-1 truncate text-[0.65rem]">{entry.member.name}</span>
                  <span className="num text-[0.58rem] text-muted">{formatNumber(entry.points)}</span>
                </div>
              ))}
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="size-4 text-primary-soft" />
              <h3 className="font-display text-sm font-semibold">كيف تكسب النقاط؟</h3>
            </div>
            <div className="space-y-1.5 text-[0.62rem] text-muted">
              <div className="flex justify-between"><span>إنجاز مهمة</span><span className="text-success">+10</span></div>
              <div className="flex justify-between"><span>اقتراح يتحول لمشروع</span><span className="text-success">+50</span></div>
              <div className="flex justify-between"><span>حضور اجتماع</span><span className="text-success">+5</span></div>
              <div className="flex justify-between"><span>إنجاز استثنائي</span><span className="text-success">+40 إلى +500</span></div>
            </div>
          </SpotlightCard>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <SpotlightCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Medal className="size-4 text-primary-soft" />
            <h3 className="font-display text-sm font-semibold">الشارات النادرة</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {badges.map((badge) => (
              <div key={badge.key} className="rounded-xl border border-line/70 p-3">
                <div className="flex items-start justify-between">
                  <span
                    className="grid size-9 place-items-center rounded-xl"
                    style={{ background: `color-mix(in oklab, ${badge.color} 15%, transparent)`, color: badge.color, boxShadow: `0 0 20px -8px ${badge.color}` }}
                  >
                    <BadgeIcon icon={badge.icon} className="size-4" />
                  </span>
                  <RarityBadge rarity={badge.rarity} />
                </div>
                <div className="mt-2 text-[0.7rem] font-medium">{badge.name}</div>
                <p className="mt-0.5 line-clamp-2 text-[0.55rem] leading-relaxed text-muted">{badge.description}</p>
                <div className="mt-2 flex items-center justify-between text-[0.5rem] text-muted">
                  <span>{badge.holders} حاصلين عليها</span>
                  <Progress value={(badge.holders / 14) * 100} className="h-1 w-16" color={badge.color} />
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="size-4 text-warning" />
            <h3 className="font-display text-sm font-semibold">آخر الإنجازات</h3>
          </div>
          <div className="max-h-[420px] space-y-2.5 overflow-y-auto pe-1">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start gap-2.5 rounded-xl border border-line/50 p-2.5">
                <Avatar name={achievement.member.name} hue={achievement.member.avatarHue} size="sm" ring={achievement.member.role.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[0.68rem] font-medium">{achievement.member.name}</span>
                    <Badge className="text-[0.46rem]">{achievement.title}</Badge>
                  </div>
                  <p className="mt-0.5 text-[0.58rem] text-muted">{achievement.description}</p>
                  <div className="mt-1 flex items-center gap-2 text-[0.48rem] text-muted/70">
                    <span className="mono">{relativeTime(achievement.earnedAt)}</span>
                    <span className="text-success">+{achievement.points} نقطة</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
