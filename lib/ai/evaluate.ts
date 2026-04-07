"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { db } from "@/lib/db";
import {
  submissions,
  aiResults,
  phases,
  sections,
  criteria,
  candidates,
  consolidatedResults,
  humanReviews,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

function genId() {
  return crypto.randomUUID().slice(0, 8);
}

function now() {
  return new Date().toISOString();
}

interface CriterionScore {
  score: number;
  justification: string;
}

interface SectionResult {
  [criterionId: string]: CriterionScore;
}

interface EvalScores {
  [sectionId: string]: SectionResult;
}

export async function evaluateSubmission(submissionId: string) {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
  });
  if (!submission || !submission.rawText) throw new Error("Submission not found or empty");

  const phase = await db.query.phases.findFirst({
    where: eq(phases.id, submission.phaseId),
  });
  if (!phase) throw new Error("Phase not found");

  const sectionList = await db.query.sections.findMany({
    where: eq(sections.phaseId, phase.id),
    orderBy: (s, { asc }) => [asc(s.order)],
  });

  const scores: EvalScores = {};
  const sectionScores: Record<string, number> = {};

  // Evaluate each section
  for (const section of sectionList) {
    const criteriaList = await db.query.criteria.findMany({
      where: eq(criteria.sectionId, section.id),
      orderBy: (c, { asc }) => [asc(c.order)],
    });

    scores[section.id] = {};

    for (const criterion of criteriaList) {
      const rubric = criterion.rubric ? JSON.parse(criterion.rubric) : {};

      const prompt = `Você é um avaliador rigoroso e justo de processos seletivos acadêmicos.
Avalie o texto abaixo no critério "${criterion.name}".

CRITÉRIO: ${criterion.name}
DESCRIÇÃO: ${criterion.description || ""}

RUBRICA DE AVALIAÇÃO:
- 9-10 (Excepcional): ${rubric.exceptional || "Excepcional"}
- 7-8 (Bom): ${rubric.good || "Bom"}
- 5-6 (Básico): ${rubric.basic || "Básico"}
- 3-4 (Insuficiente): ${rubric.insufficient || "Insuficiente"}
- 1-2 (Reprovável): ${rubric.poor || "Reprovável"}

CONTEXTO: Esta é uma avaliação da seção "${section.name}" (${section.description || ""}).
Os candidatos são estudantes de graduação — calibre expectativas para o nível.

TEXTO DO CANDIDATO:
---
${submission.rawText.slice(0, 15000)}
---

Responda EXATAMENTE neste formato JSON (sem markdown, sem explicação fora do JSON):
{"score": <número de 1 a 10>, "justification": "<2-3 frases justificando a nota, citando trechos específicos>"}`;

      try {
        const { text } = await generateText({
          model: anthropic("claude-sonnet-4-20250514"),
          prompt,
          maxOutputTokens: 300,
        });

        const cleaned = text.trim().replace(/```json\n?|\n?```/g, "");
        const parsed = JSON.parse(cleaned);
        scores[section.id][criterion.id] = {
          score: Math.min(10, Math.max(1, parsed.score)),
          justification: parsed.justification,
        };
      } catch {
        scores[section.id][criterion.id] = {
          score: 5,
          justification: "Avaliação automática falhou. Score default aplicado.",
        };
      }
    }

    // Calculate section score (weighted average of criteria)
    let sectionTotal = 0;
    for (const criterion of criteriaList) {
      const criterionScore = scores[section.id][criterion.id]?.score || 0;
      sectionTotal += criterionScore * criterion.weight;
    }
    sectionScores[section.id] = Math.round(sectionTotal * 100) / 100;
  }

  // Calculate final phase score (weighted average of sections)
  let finalScore = 0;
  for (const section of sectionList) {
    finalScore += (sectionScores[section.id] || 0) * section.weight;
  }
  finalScore = Math.round(finalScore * 100) / 100;

  // Generate profile and feedback
  const { profile, feedback, suggestedQuestions } = await generateFeedback(
    submission.rawText,
    scores,
    sectionList,
    finalScore
  );

  // Save AI result
  const resultId = genId();
  await db.insert(aiResults).values({
    id: resultId,
    submissionId,
    scores: JSON.stringify(scores),
    sectionScores: JSON.stringify(sectionScores),
    finalScore,
    profile,
    feedback,
    suggestedQuestions: JSON.stringify(suggestedQuestions),
    evaluatedAt: now(),
  });

  // Update candidate status
  if (submission.candidateId) {
    await db
      .update(candidates)
      .set({ status: "evaluated" })
      .where(eq(candidates.id, submission.candidateId));
  }

  return { resultId, finalScore, profile };
}

async function generateFeedback(
  text: string,
  scores: EvalScores,
  sectionList: Array<{ id: string; name: string }>,
  finalScore: number
): Promise<{
  profile: string;
  feedback: string;
  suggestedQuestions: string[];
}> {
  const scoresSummary = sectionList
    .map((s) => {
      const sScores = scores[s.id] || {};
      const avgScore =
        Object.values(sScores).reduce((a, c) => a + c.score, 0) /
        Math.max(Object.values(sScores).length, 1);
      return `${s.name}: ${avgScore.toFixed(1)}/10`;
    })
    .join("\n");

  const prompt = `Com base na avaliação de um candidato de processo seletivo de Liga de Mercado Financeiro:

SCORE FINAL: ${finalScore}/10

SCORES POR SEÇÃO:
${scoresSummary}

TRECHO DO TEXTO (primeiros 3000 chars):
${text.slice(0, 3000)}

Gere o seguinte em formato JSON:
{
  "profile": "<um de: Equity Research, Macro Research, Investment Banking, Renda Fixa, Quantitativo, Agro-Finance, Indefinido>",
  "feedback": "<4-5 frases de feedback construtivo: pontos fortes, áreas de melhoria, sugestões. Tom profissional e respeitoso.>",
  "suggestedQuestions": ["<3 perguntas para o pitch baseadas nos pontos fracos/fortes identificados>"]
}

Responda APENAS o JSON, sem markdown.`;

  try {
    const { text: result } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
      maxOutputTokens: 500,
    });

    const cleaned = result.trim().replace(/```json\n?|\n?```/g, "");
    return JSON.parse(cleaned);
  } catch {
    return {
      profile: "Indefinido",
      feedback: "Feedback não disponível.",
      suggestedQuestions: [],
    };
  }
}

export async function consolidateScores(teamId: string, phaseId: string) {
  // Get AI score for this team/phase
  const teamSubmissions = await db.query.submissions.findMany({
    where: and(eq(submissions.teamId, teamId), eq(submissions.phaseId, phaseId)),
  });

  let aiScore: number | null = null;
  for (const sub of teamSubmissions) {
    const result = await db.query.aiResults.findFirst({
      where: eq(aiResults.submissionId, sub.id),
    });
    if (result) {
      aiScore = result.finalScore;
      break;
    }
  }

  // Get human reviews for this team/phase
  const reviews: Array<{ overallScore: number }> = [];
  for (const sub of teamSubmissions) {
    const humanRevs = await db.query.humanReviews.findMany({
      where: eq(humanReviews.submissionId, sub.id),
    });
    reviews.push(...humanRevs);
  }

  const humanScore =
    reviews.length > 0
      ? reviews.reduce((a, r) => a + r.overallScore, 0) / reviews.length
      : null;

  // Calculate hybrid score
  let finalScore: number | null = null;
  let divergence: number | null = null;
  let divergenceFlag = "ok";

  if (aiScore !== null && humanScore !== null) {
    finalScore = aiScore * 0.55 + humanScore * 0.45;
    divergence = Math.abs(aiScore - humanScore);
    divergenceFlag =
      divergence <= 1.5 ? "ok" : divergence <= 2.5 ? "warning" : "critical";
  } else if (aiScore !== null) {
    finalScore = aiScore;
  } else if (humanScore !== null) {
    finalScore = humanScore;
  }

  // Determine classification
  let classification = "Reprovado";
  if (finalScore !== null) {
    if (finalScore >= 8.0) classification = "Destaque";
    else if (finalScore >= 7.0) classification = "Aprovado";
    else if (finalScore >= 5.0) classification = "Borderline";
  }

  // Upsert consolidated result
  const existing = await db.query.consolidatedResults.findFirst({
    where: and(
      eq(consolidatedResults.teamId, teamId),
      eq(consolidatedResults.phaseId, phaseId)
    ),
  });

  const values = {
    aiScore,
    humanScore: humanScore ? Math.round(humanScore * 100) / 100 : null,
    humanReviewCount: reviews.length,
    divergence: divergence ? Math.round(divergence * 100) / 100 : null,
    finalScore: finalScore ? Math.round(finalScore * 100) / 100 : null,
    classification,
    divergenceFlag,
    updatedAt: now(),
  };

  if (existing) {
    await db
      .update(consolidatedResults)
      .set(values)
      .where(eq(consolidatedResults.id, existing.id));
  } else {
    await db.insert(consolidatedResults).values({
      id: genId(),
      teamId,
      phaseId,
      ...values,
    });
  }

  return { aiScore, humanScore, finalScore, divergence, divergenceFlag, classification };
}
