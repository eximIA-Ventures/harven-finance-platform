import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  journeyInstances,
  journeyParticipants,
  journeyStages,
  journeyTasks,
  taskSubmissions,
  taskReviews,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { validate, submitJourneyTaskSchema } from "@/lib/validations";
import { evaluateJourneyTask } from "@/lib/ai/evaluate-journey-task";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    // Verify instance exists
    const instance = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, id),
    });

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    const body = await request.json();
    const v = validate(submitJourneyTaskSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    // Check user is a participant
    const participant = await db.query.journeyParticipants.findFirst({
      where: and(
        eq(journeyParticipants.instanceId, id),
        eq(journeyParticipants.userId, auth.user.id)
      ),
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Voce nao e participante desta jornada" },
        { status: 403 }
      );
    }

    // Verify task exists
    const task = await db.query.journeyTasks.findFirst({
      where: eq(journeyTasks.id, v.data.task_id),
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const submissionId = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    // Quiz and auto-review tasks are approved immediately on submission
    const isAutoApprove = task.reviewType === "auto" || task.taskType === "quiz";

    await db.insert(taskSubmissions).values({
      id: submissionId,
      instanceId: id,
      taskId: v.data.task_id,
      userId: auth.user.id,
      content: v.data.content || null,
      fileUrl: v.data.file_url || null,
      fileName: v.data.file_name || null,
      linkUrl: v.data.link_url || null,
      status: isAutoApprove ? "approved" : "submitted",
      score: isAutoApprove ? task.maxScore : null,
      submittedAt: now,
      updatedAt: now,
    });

    // Auto-approve: create a review record
    if (isAutoApprove) {
      await db.insert(taskReviews).values({
        id: crypto.randomUUID().slice(0, 8),
        submissionId,
        reviewerId: null,
        reviewType: "auto",
        score: task.maxScore,
        feedback: "Aprovado automaticamente",
        status: "completed",
        aiOutput: null,
        reviewedAt: now,
      });
    }

    // AI review: trigger async evaluation
    if (task.reviewType === "ai") {
      evaluateJourneyTask(submissionId).catch((err) =>
        console.error("AI evaluation failed for submission:", submissionId, err)
      );
    }

    // Stage advancement for auto-approved tasks
    if (isAutoApprove) {
      try {
        const stageId = task.stageId;
        const stageTasks = await db
          .select()
          .from(journeyTasks)
          .where(and(eq(journeyTasks.stageId, stageId), eq(journeyTasks.isRequired, 1)));

        // Exclude material/video (view-only) from required check
        const submittableRequired = stageTasks.filter(
          (t) => t.taskType !== "material" && t.taskType !== "video"
        );

        const userSubs = await db
          .select()
          .from(taskSubmissions)
          .where(
            and(
              eq(taskSubmissions.instanceId, id),
              eq(taskSubmissions.userId, auth.user.id),
              eq(taskSubmissions.status, "approved")
            )
          );

        const approvedIds = new Set(userSubs.map((s) => s.taskId));
        const allDone = submittableRequired.every((t) => approvedIds.has(t.id));

        if (allDone) {
          const stage = await db.query.journeyStages.findFirst({
            where: eq(journeyStages.id, stageId),
          });
          if (stage) {
            const allStages = await db
              .select()
              .from(journeyStages)
              .where(eq(journeyStages.journeyId, instance.journeyId))
              .orderBy(asc(journeyStages.sortOrder));

            const idx = allStages.findIndex((s) => s.id === stageId);
            const nextStage = allStages[idx + 1];

            if (nextStage) {
              await db
                .update(journeyParticipants)
                .set({ currentStageId: nextStage.id })
                .where(and(eq(journeyParticipants.instanceId, id), eq(journeyParticipants.userId, auth.user.id)));
            } else {
              await db
                .update(journeyParticipants)
                .set({ status: "completed", completedAt: now })
                .where(and(eq(journeyParticipants.instanceId, id), eq(journeyParticipants.userId, auth.user.id)));
            }
          }
        }
      } catch (err) {
        console.error("Stage advancement failed:", err);
      }
    }

    return NextResponse.json({ id: submissionId, status: isAutoApprove ? "approved" : "submitted" }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit task:", error);
    return NextResponse.json({ error: "Failed to submit task" }, { status: 500 });
  }
}
