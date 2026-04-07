"use server";

import { db } from "@/lib/db";
import { candidates, submissions, evaluations, phases, teams, aiResults, consolidatedResults, humanReviews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function genId() {
  return crypto.randomUUID().slice(0, 8);
}

function now() {
  return new Date().toISOString();
}

export async function getCandidateByToken(token: string) {
  // Try by ID first, then by magic token
  let candidate = await db.query.candidates.findFirst({
    where: eq(candidates.id, token),
  });
  if (!candidate) {
    candidate = await db.query.candidates.findFirst({
      where: eq(candidates.magicToken, token),
    });
  }
  if (!candidate) return null;

  const evaluation = await db.query.evaluations.findFirst({
    where: eq(evaluations.id, candidate.evaluationId),
  });

  const team = candidate.teamId
    ? await db.query.teams.findFirst({ where: eq(teams.id, candidate.teamId) })
    : null;

  const phaseList = await db.query.phases.findMany({
    where: eq(phases.evaluationId, candidate.evaluationId),
    orderBy: (p, { asc }) => [asc(p.order)],
  });

  const submissionList = await db.query.submissions.findMany({
    where: eq(submissions.candidateId, candidate.id),
  });

  // Get AI results for team submissions
  let teamAiResult = null;
  let teamConsolidated = null;
  if (candidate.teamId) {
    const teamSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.teamId, candidate.teamId),
    });
    for (const sub of teamSubmissions) {
      const aiRes = await db.query.aiResults.findFirst({
        where: eq(aiResults.submissionId, sub.id),
      });
      if (aiRes) teamAiResult = aiRes;
    }
    for (const phase of phaseList) {
      const consolidated = await db.query.consolidatedResults.findFirst({
        where: and(
          eq(consolidatedResults.teamId, candidate.teamId),
          eq(consolidatedResults.phaseId, phase.id)
        ),
      });
      if (consolidated) teamConsolidated = consolidated;
    }
  }

  return {
    candidate,
    evaluation,
    team,
    phases: phaseList,
    submissions: submissionList,
    aiResult: teamAiResult,
    consolidated: teamConsolidated,
  };
}

export async function submitCase(data: {
  candidateId: string;
  teamId: string | null;
  phaseId: string;
  rawText: string;
  fileName: string;
  aiUsage: string;
  aiUsageDescription: string;
}) {
  const id = genId();

  await db.insert(submissions).values({
    id,
    candidateId: data.candidateId,
    teamId: data.teamId,
    phaseId: data.phaseId,
    rawText: data.rawText,
    fileName: data.fileName,
    aiUsage: data.aiUsage,
    aiUsageDescription: data.aiUsageDescription,
    submittedAt: now(),
  });

  // Update candidate status
  await db
    .update(candidates)
    .set({ status: "submitted" })
    .where(eq(candidates.id, data.candidateId));

  return id;
}
