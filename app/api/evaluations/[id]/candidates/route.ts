import { NextResponse } from "next/server";
import { importCandidates } from "@/lib/actions/evaluations";
import { createUsersForCandidates } from "@/lib/actions/users";
import { db } from "@/lib/db";
import { candidates, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";
import { validate, importCandidatesSchema, deleteCandidateSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(importCandidatesSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const result = await importCandidates(id, v.data.candidates);

    await createUsersForCandidates(
      id,
      result.map((r) => ({ id: r.id, name: r.name, email: r.email })),
      v.data.defaultPassword || "harven2026"
    );

    return NextResponse.json({ imported: result.length, candidates: result });
  } catch (error) {
    console.error("Failed to import candidates:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(deleteCandidateSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    await db
      .delete(users)
      .where(
        and(eq(users.candidateId, v.data.candidateId), eq(users.evaluationId, id))
      );

    await db
      .delete(candidates)
      .where(
        and(eq(candidates.id, v.data.candidateId), eq(candidates.evaluationId, id))
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete candidate:", error);
    return NextResponse.json({ error: "Failed to delete candidate" }, { status: 500 });
  }
}
