import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teams, consolidatedResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("view_reports");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const teamList = await db.query.teams.findMany({
      where: eq(teams.evaluationId, id),
    });

    const results = [];
    for (const team of teamList) {
      const consolidated = await db.query.consolidatedResults.findFirst({
        where: eq(consolidatedResults.teamId, team.id),
      });
      if (consolidated) results.push(consolidated);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
