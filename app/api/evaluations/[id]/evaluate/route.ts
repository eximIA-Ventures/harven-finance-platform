import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teams, phases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { evaluateSubmission, consolidateScores } from "@/lib/ai/evaluate";
import { requireMember } from "@/lib/api-auth";
import { validate, evaluateSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(evaluateSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const results = [];

    for (const subId of v.data.submissionIds) {
      try {
        const result = await evaluateSubmission(subId);
        results.push({ submissionId: subId, ...result, status: "success" });
      } catch (error) {
        results.push({
          submissionId: subId,
          status: "error",
          error: String(error),
        });
      }
    }

    const teamList = await db.query.teams.findMany({
      where: eq(teams.evaluationId, id),
    });
    const phaseList = await db.query.phases.findMany({
      where: eq(phases.evaluationId, id),
    });

    for (const team of teamList) {
      for (const phase of phaseList) {
        await consolidateScores(team.id, phase.id);
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Evaluation failed:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}
