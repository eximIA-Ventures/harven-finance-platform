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
import { requireMember } from "@/lib/api-auth";
import { validate, reviewSubmissionSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const body = await request.json();
    const v = validate(reviewSubmissionSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    // Verify instance exists
    const instance = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, id),
    });

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    // Verify submission exists and belongs to this instance
    const submission = await db.query.taskSubmissions.findFirst({
      where: and(
        eq(taskSubmissions.id, v.data.submission_id),
        eq(taskSubmissions.instanceId, id)
      ),
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Create review
    const reviewId = crypto.randomUUID().slice(0, 8);
    await db.insert(taskReviews).values({
      id: reviewId,
      submissionId: v.data.submission_id,
      reviewerId: auth.user.id,
      reviewType: "mentor",
      score: v.data.score ?? null,
      feedback: v.data.feedback || null,
      status: "completed",
      aiOutput: null,
      reviewedAt: now,
    });

    // Update submission status
    const newStatus = v.data.status === "approved" ? "approved" : "revision_requested";
    await db
      .update(taskSubmissions)
      .set({
        status: newStatus,
        score: v.data.score ?? submission.score,
        updatedAt: now,
      })
      .where(eq(taskSubmissions.id, v.data.submission_id));

    // If approved, check if all required tasks in current stage are complete
    // If so, advance participant's currentStageId
    if (v.data.status === "approved") {
      // Get the task's stage
      const task = await db.query.journeyTasks.findFirst({
        where: eq(journeyTasks.id, submission.taskId),
      });

      if (task) {
        const stageId = task.stageId;

        // Get all required tasks in this stage (exclude material/video — view-only, no submission)
        const stageTasks = await db
          .select()
          .from(journeyTasks)
          .where(and(eq(journeyTasks.stageId, stageId), eq(journeyTasks.isRequired, 1)));

        const submittableRequired = stageTasks.filter(
          (t) => t.taskType !== "material" && t.taskType !== "video"
        );

        // Check how many are approved for this user in this instance
        const userSubmissions = await db
          .select()
          .from(taskSubmissions)
          .where(
            and(
              eq(taskSubmissions.instanceId, id),
              eq(taskSubmissions.userId, submission.userId),
              eq(taskSubmissions.status, "approved")
            )
          );

        const approvedTaskIds = new Set(userSubmissions.map((s) => s.taskId));
        const allRequiredDone = submittableRequired.every((t) => approvedTaskIds.has(t.id));

        if (allRequiredDone) {
          // Find next stage
          const stage = await db.query.journeyStages.findFirst({
            where: eq(journeyStages.id, stageId),
          });

          if (stage) {
            const allStages = await db
              .select()
              .from(journeyStages)
              .where(eq(journeyStages.journeyId, instance.journeyId))
              .orderBy(asc(journeyStages.sortOrder));

            const currentIndex = allStages.findIndex((s) => s.id === stageId);
            const nextStage = allStages[currentIndex + 1];

            if (nextStage) {
              // Advance to next stage
              await db
                .update(journeyParticipants)
                .set({ currentStageId: nextStage.id })
                .where(
                  and(
                    eq(journeyParticipants.instanceId, id),
                    eq(journeyParticipants.userId, submission.userId)
                  )
                );
            } else {
              // All stages complete — mark participant as completed
              await db
                .update(journeyParticipants)
                .set({ status: "completed", completedAt: now })
                .where(
                  and(
                    eq(journeyParticipants.instanceId, id),
                    eq(journeyParticipants.userId, submission.userId)
                  )
                );
            }
          }
        }
      }
    }

    return NextResponse.json({ id: reviewId, status: newStatus }, { status: 201 });
  } catch (error) {
    console.error("Failed to review submission:", error);
    return NextResponse.json({ error: "Failed to review submission" }, { status: 500 });
  }
}
