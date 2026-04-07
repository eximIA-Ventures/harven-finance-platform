import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "hv-session";
function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return secret;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

function legacyHashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createSessionToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  const hmac = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${hmac}`).toString("base64");
}

function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 3) return null;
    const hmac = parts.pop()!;
    const payload = parts.join(":");
    const expected = crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
    if (hmac !== expected) return null;
    return parts[0];
  } catch {
    return null;
  }
}

// All possible permissions
export const ALL_PERMISSIONS = [
  "admin",          // full access
  "evaluate",       // can evaluate teams (banca)
  "view_ranking",   // can see ranking
  "manage_users",   // can add/edit users
  "manage_eval",    // can edit evaluation settings
  "view_reports",   // can see reports
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  type: "candidate" | "member";
  evaluationId: string | null;
  candidateId: string | null;
  permissions: Permission[];
  mustChangePassword?: boolean;
}

export function parsePermissions(raw: string | null): Permission[] {
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export function hasPermission(user: SessionUser, perm: Permission): boolean {
  if (user.permissions.includes("admin")) return true;
  return user.permissions.includes(perm);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return null;
  const userId = verifySessionToken(session.value);
  if (!userId) return null;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    type: user.type as "candidate" | "member",
    evaluationId: user.evaluationId,
    candidateId: user.candidateId,
    permissions: parsePermissions(user.permissions),
  };
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function login(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
  if (!user) return null;

  // Try bcrypt first (new format)
  const bcryptMatch = bcrypt.compareSync(password, user.passwordHash);
  // Fallback to legacy SHA256 (old format)
  const legacyMatch = !bcryptMatch && user.passwordHash === legacyHashPassword(password);

  if (!bcryptMatch && !legacyMatch) return null;

  // If legacy matched, upgrade hash to bcrypt transparently
  if (legacyMatch) {
    await db.update(users).set({ passwordHash: hashPassword(password) }).where(eq(users.id, user.id));
  }

  await setSession(user.id);
  return {
    id: user.id, email: user.email, name: user.name,
    mustChangePassword: user.mustChangePassword === 1,
    type: user.type as "candidate" | "member",
    evaluationId: user.evaluationId, candidateId: user.candidateId,
    permissions: parsePermissions(user.permissions),
  };
}

export function getRedirectForRole(user: SessionUser): string {
  if (user.type === "member") {
    return "/admin";
  }
  return user.candidateId ? `/c/${user.candidateId}` : "/";
}
