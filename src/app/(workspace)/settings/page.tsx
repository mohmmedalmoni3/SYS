import type { Metadata } from "next";
import { requirePermission } from "@/server/guard";
import { getAuditLog, getInvitations, getMembers, getRoles, getSettings } from "@/server/repository";
import { hasPermission } from "@/lib/permissions";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "الإعدادات" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requirePermission("settings.view");
  const [roles, members, audit, settings, invitations] = await Promise.all([
    getRoles(),
    getMembers(),
    getAuditLog(60),
    getSettings(),
    getInvitations(),
  ]);

  return (
    <SettingsView
      roles={roles}
      members={members}
      audit={audit}
      settings={settings}
      invitations={invitations.map((invitation) => ({
        id: invitation.id,
        code: invitation.code,
        email: invitation.email,
        roleName: invitation.roleName,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      }))}
      canManageRoles={hasPermission(user.permissions, "members.rank.edit")}
      canEditSettings={hasPermission(user.permissions, "settings.edit")}
      canViewAudit={hasPermission(user.permissions, "audit.view")}
      canDanger={user.permissions.includes("system.danger")}
      currentUserId={user.id}
    />
  );
}
