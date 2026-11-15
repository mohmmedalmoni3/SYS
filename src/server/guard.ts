import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission, type PermissionKey } from "@/lib/permissions";

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requirePermission(permission: PermissionKey) {
  const user = await requireSession();
  if (!hasPermission(user.permissions, permission)) {
    redirect(`/forbidden?permission=${encodeURIComponent(permission)}`);
  }
  return user;
}

export class AuthorizationError extends Error {
  constructor(message = "ليس لديك صلاحية لتنفيذ هذا الإجراء") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/** Throws instead of redirecting — used inside server actions. */
export async function assertPermission(permission: PermissionKey) {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("انتهت الجلسة، يرجى تسجيل الدخول مجدداً");
  if (!hasPermission(user.permissions, permission)) throw new AuthorizationError();
  return user;
}
