"use server";

import { db } from "@/lib/db";
import { humanEvaluators, humanReviews, submissions, teams, candidates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function genId() {
  return crypto.randomUUID().slice(0, 8);
}

function now() {
  return new Date().toISOString();
}

export async function getEvaluatorByToken(token: string) {
  const evaluator = await db.query.humanEvaluators.findFirst({
    where: eq(humanEvaluators.accessToken, token),
  });
  if (!evaluator) return null;

  const teamList = await db.query.teams.findMany({
    where: eq(teams.evaluationId, evaluator.evaluationId),
    orderBy: (t, { asc }) => [asc(t.number)],
  });

  const teamsWithSubmissions = await Promise.all(
    teamList.map(async (team) => {
      const teamSubmissions = await db.query.submissions.findMany({
        where: eq(submissions.teamId, team.id),
      });
      const members = await db.query.candidates.findMany({
        where: eq(candidates.teamId, team.id),
      });
      const reviewed = await db.query.humanReviews.findFirst({
        where: eq(humanReviews.evaluatorId, evaluator.id),
      });
      return {
        ...team,
        submissions: teamSubmissions,
        members,
        hasReviewed: !!reviewed,
      };
    })
  );

  return { evaluator, teams: teamsWithSubmissions };
}

export async function submitHumanReview(data: {
  evaluatorId: string;
  submissionId: string;
  analyticalScore: number;
  reasoningScore: number;
  originalityScore: number;
  communicationScore: number;
  impression: string;
  recommendation: string;
}) {
  const overallScore =
    data.analyticalScore * 0.3 +
    data.reasoningScore * 0.3 +
    data.originalityScore * 0.2 +
    data.communicationScore * 0.2;

  const id = genId();
  await db.insert(humanReviews).values({
    id,
    evaluatorId: data.evaluatorId,
    submissionId: data.submissionId,
    analyticalScore: data.analyticalScore,
    reasoningScore: data.reasoningScore,
    originalityScore: data.originalityScore,
    communicationScore: data.communicationScore,
    overallScore: Math.round(overallScore * 100) / 100,
    impression: data.impression,
    recommendation: data.recommendation,
    reviewedAt: now(),
  });

  return { id, overallScore };
}
