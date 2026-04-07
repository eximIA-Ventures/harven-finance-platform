import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teams, candidates, submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { teamId } = await params;

    const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
    const members = await db.query.candidates.findMany({ where: eq(candidates.teamId, teamId) });
    const teamSubs = await db.query.submissions.findMany({ where: eq(submissions.teamId, teamId) });
    const submissionText = teamSubs[0]?.rawText || "";

    return NextResponse.json({ team, members, submissionText, bancaFeedback: "" });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
