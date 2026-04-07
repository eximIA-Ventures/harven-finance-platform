import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  journeyInstances,
  journeyParticipants,
  journeyStages,
  journeyTasks,
  taskSubmissions,
  taskReviews,
  users,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  _request: Request,
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

    // Get participant record
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

    // Get all stages with tasks
    const stages = await db
      .select()
      .from(journeyStages)
      .where(eq(journeyStages.journeyId, instance.journeyId))
      .orderBy(asc(journeyStages.sortOrder));

    // Get ALL submissions for this instance (all participants)
    const allInstanceSubmissions = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.instanceId, id));

    // Get all reviews
    const allSubIds = allInstanceSubmissions.map(s => s.id);
    const allReviews = allSubIds.length > 0
      ? await db.select().from(taskReviews)
      : [];
    const reviewMap = new Map(allReviews.filter(r => allSubIds.includes(r.submissionId)).map(r => [r.submissionId, r]));

    // Get all participants with names for member status display
    const allParticipants = await db
      .select({ userId: journeyParticipants.userId, userName: users.name, userAvatar: users.avatarUrl })
      .from(journeyParticipants)
      .leftJoin(users, eq(users.id, journeyParticipants.userId))
      .where(eq(journeyParticipants.instanceId, id));

    // My submissions indexed by task
    const mySubmissions = allInstanceSubmissions.filter(s => s.userId === auth.user.id);
    const submissionsByTask = new Map(mySubmissions.map(s => [s.taskId, s]));

    // Build stage-by-stage progress
    const stageProgress = await Promise.all(
      stages.map(async (stage) => {
        const tasks = await db
          .select()
          .from(journeyTasks)
          .where(eq(journeyTasks.stageId, stage.id))
          .orderBy(asc(journeyTasks.sortOrder));

        const taskStatuses = tasks.map((task) => {
          const sub = submissionsByTask.get(task.id);
          const review = sub ? reviewMap.get(sub.id) : null;
          let parsedConfig = null;
          try { parsedConfig = task.config ? JSON.parse(task.config) : null; } catch { /* silent */ }

          const isGroup = (task.scope || "group") === "group";
          const isIndividual = !isGroup;

          // For group tasks: check if ANY participant submitted
          const groupSub = isGroup ? allInstanceSubmissions.find(s => s.taskId === task.id) : null;
          const groupReview = groupSub ? reviewMap.get(groupSub.id) : null;
          const effectiveSub = isGroup ? (sub || groupSub) : sub;
          const effectiveReview = isGroup ? (review || groupReview) : review;

          // Member completion status (for individual tasks)
          let memberStatus: Array<{ userId: string; name: string | null; avatar: string | null; submitted: boolean; approved: boolean }> | null = null;
          if (isIndividual) {
            memberStatus = allParticipants.map(p => {
              const pSub = allInstanceSubmissions.find(s => s.taskId === task.id && s.userId === p.userId);
              return {
                userId: p.userId,
                name: p.userName,
                avatar: p.userAvatar,
                submitted: !!pSub,
                approved: pSub?.status === "approved",
              };
            });
          }

          return {
            taskId: task.id,
            taskName: task.name,
            taskType: task.taskType,
            description: task.description,
            isRequired: task.isRequired === 1,
            scope: task.scope || "group",
            reviewType: task.reviewType,
            maxScore: task.maxScore,
            config: parsedConfig,
            status: effectiveSub?.status || "pending",
            score: effectiveSub?.score || null,
            submittedAt: effectiveSub?.submittedAt || null,
            reviewFeedback: effectiveReview?.feedback || null,
            reviewScore: effectiveReview?.score ?? null,
            memberStatus,
          };
        });

        const completedCount = taskStatuses.filter((t) => t.status === "approved").length;
        const totalRequired = taskStatuses.filter((t) => t.isRequired).length;
        const requiredCompleted = taskStatuses.filter(
          (t) => t.isRequired && t.status === "approved"
        ).length;

        return {
          stageId: stage.id,
          stageName: stage.name,
          stageColor: stage.color,
          sortOrder: stage.sortOrder,
          isCurrent: participant.currentStageId === stage.id,
          tasks: taskStatuses,
          completedCount,
          totalTasks: tasks.length,
          totalRequired,
          requiredCompleted,
          stageComplete: totalRequired > 0 && requiredCompleted >= totalRequired,
        };
      })
    );

    const totalTasks = stageProgress.reduce((sum, s) => sum + s.totalTasks, 0);
    const totalCompleted = stageProgress.reduce((sum, s) => sum + s.completedCount, 0);

    return NextResponse.json({
      instanceId: id,
      participantStatus: participant.status,
      currentStageId: participant.currentStageId,
      completedAt: participant.completedAt,
      overallProgress: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
      stages: stageProgress,
    });
  } catch (error) {
    console.error("Failed to get progress:", error);
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}
