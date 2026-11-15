"use client";

import { useSession } from "next-auth/react";
import { hasAnyPermission, hasPermission, type PermissionKey } from "@/lib/permissions";

/**
 * usePermission — client-side mirror of the server guard. Use it to hide
 * buttons/pages; never as the only protection.
 *
 * @example
 * const { can } = usePermission();
 * return can("projects.create") ? <Button>مشروع جديد</Button> : null;
 */
export function usePermission() {
  const { data: session, status } = useSession();
  const permissions = session?.user?.permissions ?? [];

  return {
    permissions,
    loading: status === "loading",
    can: (permission: PermissionKey) => hasPermission(permissions, permission),
    canAny: (required: string[]) => hasAnyPermission(permissions, required),
    role: session?.user?.role ?? null,
  };
}
