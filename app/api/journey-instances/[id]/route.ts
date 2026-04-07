import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  journeyInstances,
  journeyParticipants,
  journeys,
  journeyStages,
  journeyTasks,
  taskSubmissions,
  taskReviews,
  users,
} from "@/lib/db/schema";
import { eq, and, asc, desc } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const instance = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, id),
    });

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    // Verify user is participant, mentor, creator, or admin
    const isAdmin = auth.user.permissions.includes("admin") || auth.user.permissions.includes("manage_eval");
    const isCreator = instance.createdBy === auth.user.id;
    if (!isAdmin && !isCreator) {
      const participant = await db.query.journeyParticipants.findFirst({
        where: and(
          eq(journeyParticipants.instanceId, id),
          eq(journeyParticipants.userId, auth.user.id)
        ),
      });
      if (!participant) {
        return NextResponse.json({ error: "Acesso nao autorizado" }, { status: 403 });
      }
    }

    // Journey info
    const journey = await db.query.journeys.findFirst({
      where: eq(journeys.id, instance.journeyId),
    });

    // Stages with tasks
    const stages = await db
      .select()
      .from(journeyStages)
      .where(eq(journeyStages.journeyId, instance.journeyId))
      .orderBy(asc(journeyStages.sortOrder));

    const stagesWithTasks = await Promise.all(
      stages.map(async (stage) => {
        const tasks = await db
          .select()
          .from(journeyTasks)
          .where(eq(journeyTasks.stageId, stage.id))
          .orderBy(asc(journeyTasks.sortOrder));

        // Parse config for each task
        const tasksWithConfig = tasks.map((t) => {
          let parsedConfig = null;
          try {
            parsedConfig = t.config ? JSON.parse(t.config) : null;
          } catch {
            /* silent */
          }
          return { ...t, parsedConfig };
        });

        return { ...stage, tasks: tasksWithConfig };
      })
    );

    // Participants
    const participants = await db
      .select({
        id: journeyParticipants.id,
        userId: journeyParticipants.userId,
        role: journeyParticipants.role,
        status: journeyParticipants.status,
        currentStageId: journeyParticipants.currentStageId,
        completedAt: journeyParticipants.completedAt,
        joinedAt: journeyParticipants.joinedAt,
        userName: users.name,
        userAvatar: users.avatarUrl,
        memberStatus: users.memberStatus,
      })
      .from(journeyParticipants)
      .leftJoin(users, eq(users.id, journeyParticipants.userId))
      .where(eq(journeyParticipants.instanceId, id));

    // ALL submissions for this instance (across all participants)
    const allSubmissions = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.instanceId, id));

    // Get reviews for all submissions in one batch
    const allSubmissionIds = allSubmissions.map((s) => s.id);
    let allReviews: Array<{
      id: string;
      submissionId: string;
      reviewerId: string | null;
      reviewType: string;
      score: number | null;
      feedback: string | null;
      status: string | null;
      reviewedAt: string;
    }> = [];

    if (allSubmissionIds.length > 0) {
      // Fetch all reviews — we'll match them client-side
      const reviewRows = await db
        .select({
          id: taskReviews.id,
          submissionId: taskReviews.submissionId,
          reviewerId: taskReviews.reviewerId,
          reviewType: taskReviews.reviewType,
          score: taskReviews.score,
          feedback: taskReviews.feedback,
          status: taskReviews.status,
          reviewedAt: taskReviews.reviewedAt,
        })
        .from(taskReviews)
        .orderBy(desc(taskReviews.reviewedAt));

      // Filter to only reviews for submissions in this instance
      const subIdSet = new Set(allSubmissionIds);
      allReviews = reviewRows.filter((r) => subIdSet.has(r.submissionId));
    }

    // Build a map: submissionId -> latest review
    const reviewBySubmission = new Map<string, (typeof allReviews)[0]>();
    for (const review of allReviews) {
      // Since ordered desc by reviewedAt, first one per submission is latest
      if (!reviewBySubmission.has(review.submissionId)) {
        reviewBySubmission.set(review.submissionId, review);
      }
    }

    // Enrich submissions with review data
    const enrichedSubmissions = allSubmissions.map((sub) => {
      const review = reviewBySubmission.get(sub.id);
      return {
        ...sub,
        reviewFeedback: review?.feedback || null,
        reviewScore: review?.score ?? null,
        reviewedAt: review?.reviewedAt || null,
      };
    });

    // Compute per-participant progress (keep backward compatibility)
    const participantsWithProgress = participants.map((participant) => {
      const stageProgress = stagesWithTasks.map((stage) => {
        const stageTaskIds = stage.tasks.map((t) => t.id);
        const userSubs = allSubmissions.filter(
          (s) => s.userId === participant.userId && stageTaskIds.includes(s.taskId)
        );
        const submitted = userSubs.length;
        const approved = userSubs.filter((s) => s.status === "approved").length;

        return {
          stageId: stage.id,
          stageName: stage.name,
          totalTasks: stage.tasks.length,
          submitted,
          approved,
        };
      });

      return {
        ...participant,
        stageProgress,
      };
    });

    return NextResponse.json({
      ...instance,
      journey: journey || null,
      stages: stagesWithTasks,
      participants: participantsWithProgress,
      submissions: enrichedSubmissions,
    });
  } catch (error) {
    console.error("Failed to get journey instance:", error);
    return NextResponse.json({ error: "Failed to get journey instance" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    await db
      .update(journeyInstances)
      .set({
        ...(body.status !== undefined && { status: body.status }),
        ...(body.start_date !== undefined && { startDate: body.start_date }),
        ...(body.end_date !== undefined && { endDate: body.end_date }),
        ...(body.mentor_id !== undefined && { mentorId: body.mentor_id }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(journeyInstances.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update journey instance:", error);
    return NextResponse.json({ error: "Failed to update journey instance" }, { status: 500 });
  }
}
