import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { humanEvaluators, submissions, teams, candidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { submitHumanReview } from "@/lib/actions/human-review";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; teamId: string }> }
) {
  try {
    const { token, teamId } = await params;

    const evaluator = await db.query.humanEvaluators.findFirst({
      where: eq(humanEvaluators.accessToken, token),
    });
    if (!evaluator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    // Verify team belongs to the same evaluation as the evaluator
    if (team && team.evaluationId !== evaluator.evaluationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const members = await db.query.candidates.findMany({
      where: eq(candidates.teamId, teamId),
    });

    const teamSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.teamId, teamId),
    });

    const submissionText = teamSubmissions[0]?.rawText || "";

    return NextResponse.json({
      team,
      members,
      submissions: teamSubmissions,
      submissionText,
    });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string; teamId: string }> }
) {
  try {
    const { token, teamId } = await params;

    const evaluator = await db.query.humanEvaluators.findFirst({
      where: eq(humanEvaluators.accessToken, token),
    });
    if (!evaluator) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify team belongs to evaluator's evaluation
    const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
    if (team && team.evaluationId !== evaluator.evaluationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Find submission for this team
    const teamSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.teamId, teamId),
    });
    if (teamSubmissions.length === 0) {
      return NextResponse.json({ error: "No submission" }, { status: 404 });
    }

    const body = await request.json();
    const result = await submitHumanReview({
      evaluatorId: evaluator.id,
      submissionId: teamSubmissions[0].id,
      ...body,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Review failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
