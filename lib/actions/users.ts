"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, type Permission } from "@/lib/auth";
import crypto from "crypto";

function genId() { return crypto.randomUUID().slice(0, 8); }
function now() { return new Date().toISOString(); }

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  type: "candidate" | "member";
  evaluationId?: string;
  candidateId?: string;
  permissions?: Permission[];
}) {
  const id = genId();
  const email = data.email.toLowerCase().trim();

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    await db.update(users).set({
      type: data.type,
      evaluationId: data.evaluationId || existing.evaluationId,
      candidateId: data.candidateId || existing.candidateId,
      permissions: JSON.stringify(data.permissions || []),
    }).where(eq(users.id, existing.id));
    return existing.id;
  }

  await db.insert(users).values({
    id, email,
    passwordHash: hashPassword(data.password),
    name: data.name,
    type: data.type,
    evaluationId: data.evaluationId || null,
    candidateId: data.candidateId || null,
    permissions: JSON.stringify(data.permissions || []),
    createdAt: now(),
  });
  return id;
}

export async function createUsersForCandidates(
  evaluationId: string,
  candidates: Array<{ id: string; name: string; email: string }>,
  defaultPassword: string
) {
  for (const c of candidates) {
    await createUser({
      email: c.email, password: defaultPassword, name: c.name,
      type: "candidate", evaluationId, candidateId: c.id,
    });
  }
}

export async function createMember(
  evaluationId: string,
  data: { name: string; email: string; password: string; permissions: Permission[] }
) {
  return createUser({
    email: data.email, password: data.password, name: data.name,
    type: "member", evaluationId, permissions: data.permissions,
  });
}
