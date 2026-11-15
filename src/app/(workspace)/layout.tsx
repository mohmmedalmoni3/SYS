import { redirect } from "next/navigation";
import { requireSession } from "@/server/guard";
import { getMemberLite, getNotifications, getSearchIndex } from "@/server/repository";
import { AppShell } from "@/components/shell/app-shell";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await requireSession();
  const member = await getMemberLite(sessionUser.id);
  if (!member) redirect("/sign-in");

  const [notifications, searchItems] = await Promise.all([
    getNotifications(sessionUser.id),
    getSearchIndex(),
  ]);

  return (
    <AppShell
      user={{ ...member, email: sessionUser.email ?? "", level: sessionUser.level }}
      points={sessionUser.points}
      permissions={sessionUser.permissions}
      notifications={notifications}
      searchItems={searchItems}
    >
      {children}
    </AppShell>
  );
}
