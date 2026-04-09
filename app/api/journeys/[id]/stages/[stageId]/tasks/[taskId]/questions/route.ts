import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { quizQuestions, journeyTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createQuizQuestionSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { taskId } = await params;

    const questions = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.taskId, taskId),
      orderBy: (q, { asc }) => [asc(q.sortOrder)],
    });

    const parsed = questions.map((q) => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : [],
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { taskId } = await params;

    const task = await db.query.journeyTasks.findFirst({
      where: eq(journeyTasks.id, taskId),
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const v = validate(createQuizQuestionSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const questionId = crypto.randomUUID().slice(0, 8);

    // Get next sort order
    const existing = await db.query.quizQuestions.findMany({
      where: eq(quizQuestions.taskId, taskId),
    });

    await db.insert(quizQuestions).values({
      id: questionId,
      taskId,
      question: v.data.question,
      questionType: v.data.question_type || "multiple_choice",
      options: v.data.options ? JSON.stringify(v.data.options) : null,
      correctAnswer: v.data.correct_answer || null,
      sortOrder: v.data.sort_order ?? existing.length,
      points: v.data.points ?? 1,
    });

    return NextResponse.json({ id: questionId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create question:", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const questionId = url.searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId required" }, { status: 400 });
    }

    await db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete question:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}
