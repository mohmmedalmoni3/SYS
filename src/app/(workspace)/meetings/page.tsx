import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getMeetings } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { MeetingsView } from "@/components/meetings/meetings-view";

export const metadata: Metadata = { title: "الاجتماعات" };
export const dynamic = "force-dynamic";

export default async function MeetingsPage() {
  const user = await requirePermission("meetings.view");
  const meetings = await getMeetings();

  return (
    <MeetingsView
      meetings={meetings}
      canAttendance={hasPermission(user.permissions, "meetings.attendance")}
      canMinutes={hasPermission(user.permissions, "meetings.minutes")}
    />
  );
}
