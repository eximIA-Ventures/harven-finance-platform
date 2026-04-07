import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, candidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const candidateList = await db.query.candidates.findMany({
      where: eq(candidates.evaluationId, id),
    });

    const allSubmissions = [];
    for (const c of candidateList) {
      const subs = await db.query.submissions.findMany({
        where: eq(submissions.candidateId, c.id),
      });
      allSubmissions.push(...subs);
    }

    return NextResponse.json(allSubmissions);
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json([], { status: 500 });
  }
}
