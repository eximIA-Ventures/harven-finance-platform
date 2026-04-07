import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teams, candidates, consolidatedResults, submissions, aiResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";
import { validate, updateFeedbackSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    await params;
    const body = await request.json();
    const v = validate(updateFeedbackSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const existing = await db.query.consolidatedResults.findFirst({
      where: eq(consolidatedResults.teamId, v.data.teamId),
    });

    if (!existing) {
      return NextResponse.json({ error: "No consolidated result for this team yet" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (v.data.feedback !== undefined) updates.feedback = v.data.feedback;
    if (v.data.feedbackSent !== undefined) updates.feedbackSent = v.data.feedbackSent ? 1 : 0;

    await db
      .update(consolidatedResults)
      .set(updates)
      .where(eq(consolidatedResults.teamId, v.data.teamId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const teamList = await db.query.teams.findMany({
      where: eq(teams.evaluationId, id),
      orderBy: (t, { asc }) => [asc(t.number)],
    });

    const result = [];

    for (const team of teamList) {
      const members = await db.query.candidates.findMany({
        where: eq(candidates.teamId, team.id),
      });

      const consolidated = await db.query.consolidatedResults.findFirst({
        where: eq(consolidatedResults.teamId, team.id),
      });

      let aiFeedback: string | null = null;
      const teamSubs = await db.query.submissions.findMany({
        where: eq(submissions.teamId, team.id),
      });
      for (const sub of teamSubs) {
        const aiRes = await db.query.aiResults.findFirst({
          where: eq(aiResults.submissionId, sub.id),
        });
        if (aiRes?.feedback) {
          aiFeedback = aiRes.feedback;
          break;
        }
      }

      result.push({
        teamId: team.id,
        teamNumber: team.number,
        members: members.map((m) => m.name),
        finalScore: consolidated?.finalScore ?? null,
        classification: consolidated?.classification ?? "—",
        feedback: consolidated?.feedback ?? null,
        aiFeedback,
        feedbackSent: consolidated?.feedbackSent === 1,
      });
    }

    return NextResponse.json({ teams: result });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}
