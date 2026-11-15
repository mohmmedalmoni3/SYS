import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getAchievements, getBadges, getLeaderboard } from "@/server/repository";
import { AchievementsView } from "@/components/achievements/achievements-view";

export const metadata: Metadata = { title: "الإنجازات" };
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await requirePermission("achievements.view");
  const [leaderboardAll, leaderboardMonth, badges, achievements] = await Promise.all([
    getLeaderboard("all"),
    getLeaderboard("month"),
    getBadges(),
    getAchievements(40),
  ]);

  return (
    <AchievementsView
      leaderboardAll={leaderboardAll}
      leaderboardMonth={leaderboardMonth}
      badges={badges}
      achievements={achievements}
      currentUserId={user.id}
    />
  );
}
