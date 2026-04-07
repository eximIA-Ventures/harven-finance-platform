import { getSession, type SessionUser, type Permission } from "./auth";

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requirePermission(perm: Permission): Promise<SessionUser> {
  const session = await requireAuth();
  if (!session.permissions.includes("admin") && !session.permissions.includes(perm)) {
    throw new Error("Forbidden");
  }
  return session;
}
