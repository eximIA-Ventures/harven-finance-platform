"use server";

import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { db } from "@/lib/db";
import { taskSubmissions, taskReviews, journeyTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function genId() {
  return crypto.randomUUID().slice(0, 8);
}

function now() {
  return new Date().toISOString();
}

interface AIEvalResult {
  score: number;
  feedback: string;
  suggestions: string[];
}

/**
 * Evaluate a journey task submission using Claude AI.
 * Creates a taskReview record with the AI output.
 */
export async function evaluateJourneyTask(submissionId: string): Promise<AIEvalResult> {
  const submission = await db.query.taskSubmissions.findFirst({
    where: eq(taskSubmissions.id, submissionId),
  });
  if (!submission) throw new Error("Submission not found");

  const task = await db.query.journeyTasks.findFirst({
    where: eq(journeyTasks.id, submission.taskId),
  });
  if (!task) throw new Error("Task not found");

  const content = submission.content || submission.linkUrl || submission.fileName || "";
  if (!content.trim()) throw new Error("No content to evaluate");

  const config = task.config ? JSON.parse(task.config) : {};
  const maxScore = task.maxScore || 10;

  const prompt = `Voce e um avaliador academico rigoroso mas construtivo. Avalie a seguinte entrega de um aluno.

## Tarefa
Nome: ${task.name}
Descricao: ${task.description || "Sem descricao"}
Tipo: ${task.taskType}
Nota maxima: ${maxScore}

## Conteudo Submetido
${content}

## Instrucoes
1. Avalie a qualidade, profundidade e relevancia da entrega
2. Atribua uma nota de 0 a ${maxScore} (pode usar decimais)
3. Forneca feedback construtivo e especifico
4. Sugira 2-3 melhorias concretas

Responda EXATAMENTE neste formato JSON:
{
  "score": <number>,
  "feedback": "<string com feedback detalhado>",
  "suggestions": ["<melhoria 1>", "<melhoria 2>", "<melhoria 3>"]
}`;

  try {
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
      maxOutputTokens: 1000,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const result: AIEvalResult = JSON.parse(jsonMatch[0]);
    result.score = Math.min(Math.max(result.score, 0), maxScore);

    // Save review
    await db.insert(taskReviews).values({
      id: genId(),
      submissionId,
      reviewerId: null,
      reviewType: "ai",
      score: result.score,
      feedback: result.feedback,
      status: "completed",
      aiOutput: JSON.stringify(result),
      reviewedAt: now(),
    });

    // Update submission status
    await db
      .update(taskSubmissions)
      .set({ status: "approved", score: result.score, updatedAt: now() })
      .where(eq(taskSubmissions.id, submissionId));

    return result;
  } catch (error) {
    console.error("AI evaluation failed:", error);

    // Fallback: mark as under_review for manual review
    await db
      .update(taskSubmissions)
      .set({ status: "under_review", updatedAt: now() })
      .where(eq(taskSubmissions.id, submissionId));

    throw error;
  }
}
