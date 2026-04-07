import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { candidates, teams, consolidatedResults, humanReviews, humanEvaluators, submissions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const candidateList = await db.query.candidates.findMany({
      where: eq(candidates.evaluationId, id),
    });
    const teamList = await db.query.teams.findMany({
      where: eq(teams.evaluationId, id),
    });

    const result = await Promise.all(
      candidateList.map(async (c) => {
        let aiScore: number | null = null;
        let humanScore: number | null = null;
        let finalScore: number | null = null;
        let classification: string | null = null;
        let divergence: number | null = null;
        let humanReviewCount = 0;
        const reviewerDetails: Array<{ name: string; score: number; recommendation: string }> = [];

        if (c.teamId) {
          const consolidated = await db.query.consolidatedResults.findFirst({
            where: eq(consolidatedResults.teamId, c.teamId),
          });
          if (consolidated) {
            aiScore = consolidated.aiScore;
            humanScore = consolidated.humanScore;
            finalScore = consolidated.finalScore;
            classification = consolidated.classification;
            divergence = consolidated.divergence;
            humanReviewCount = consolidated.humanReviewCount ?? 0;
          }

          const teamSubs = await db.query.submissions.findMany({
            where: eq(submissions.teamId, c.teamId),
          });
          for (const sub of teamSubs) {
            const reviews = await db.query.humanReviews.findMany({
              where: eq(humanReviews.submissionId, sub.id),
            });
            for (const r of reviews) {
              const evaluator = await db.query.humanEvaluators.findFirst({
                where: eq(humanEvaluators.id, r.evaluatorId),
              });
              reviewerDetails.push({
                name: evaluator?.name || "Avaliador",
                score: r.overallScore,
                recommendation: r.recommendation,
              });
            }
          }
        }

        const team = teamList.find((t) => t.id === c.teamId);
        return {
          ...c,
          teamNumber: team?.number ?? null,
          aiScore, humanScore, finalScore, classification, divergence, humanReviewCount, reviewerDetails,
        };
      })
    );

    return NextResponse.json({ candidates: result });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ candidates: [] }, { status: 500 });
  }
}
