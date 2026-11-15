import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getAnnouncements, getChannels, getNotifications } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { CommsView } from "@/components/comms/comms-view";

export const metadata: Metadata = { title: "التواصل" };
export const dynamic = "force-dynamic";

export default async function CommsPage() {
  const user = await requirePermission("comms.view");
  const [channels, announcements, notifications] = await Promise.all([
    getChannels(),
    getAnnouncements(),
    getNotifications(user.id),
  ]);

  return (
    <CommsView
      channels={channels}
      announcements={announcements}
      notifications={notifications}
      currentUserId={user.id}
      canAnnounce={hasPermission(user.permissions, "comms.announce")}
    />
  );
}
