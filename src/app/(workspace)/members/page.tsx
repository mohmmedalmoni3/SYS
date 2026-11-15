import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getMembers, getRoles } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { MembersView } from "@/components/members/members-view";

export const metadata: Metadata = { title: "الأعضاء" };
export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const user = await requirePermission("members.view");
  const [members, roles] = await Promise.all([getMembers(), getRoles()]);

  return (
    <MembersView
      members={members}
      roles={roles}
      canInvite={hasPermission(user.permissions, "members.invite")}
    />
  );
}
