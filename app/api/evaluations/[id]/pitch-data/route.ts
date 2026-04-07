import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { submissions, aiResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const teamId = url.searchParams.get("teamId");
    if (!teamId) return NextResponse.json({ suggestedQuestions: [] });

    const teamSubs = await db.query.submissions.findMany({
      where: eq(submissions.teamId, teamId),
    });

    for (const sub of teamSubs) {
      const result = await db.query.aiResults.findFirst({
        where: eq(aiResults.submissionId, sub.id),
      });
      if (result) {
        return NextResponse.json({
          suggestedQuestions: result.suggestedQuestions ? JSON.parse(result.suggestedQuestions) : [],
          profile: result.profile,
          finalScore: result.finalScore,
        });
      }
    }

    return NextResponse.json({ suggestedQuestions: [] });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ suggestedQuestions: [] }, { status: 500 });
  }
}
