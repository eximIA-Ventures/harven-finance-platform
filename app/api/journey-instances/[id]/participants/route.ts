import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  journeyInstances,
  journeyParticipants,
  journeyStages,
  journeyTasks,
  taskSubmissions,
  users,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";

// GET — list participants with progress
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { id: instanceId } = await params;

    const instance = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, instanceId),
    });
    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    // Get participants
    const participants = await db.query.journeyParticipants.findMany({
      where: eq(journeyParticipants.instanceId, instanceId),
    });

    // Get user details
    const userIds = participants.map((p) => p.userId);
    let userMap: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
      const userRows = await db.query.users.findMany({
        where: inArray(users.id, userIds),
        columns: { id: true, name: true, email: true },
      });
      userMap = Object.fromEntries(userRows.map((u) => [u.id, { name: u.name, email: u.email }]));
    }

    // Get stages and tasks for progress calculation
    const stages = await db.query.journeyStages.findMany({
      where: eq(journeyStages.journeyId, instance.journeyId),
      orderBy: (s, { asc }) => [asc(s.sortOrder)],
    });

    const stageIds = stages.map((s) => s.id);
    let tasks: { id: string; stageId: string; isRequired: number | null }[] = [];
    if (stageIds.length > 0) {
      tasks = await db
        .select({ id: journeyTasks.id, stageId: journeyTasks.stageId, isRequired: journeyTasks.isRequired })
        .from(journeyTasks)
        .where(inArray(journeyTasks.stageId, stageIds));
    }

    const taskIds = tasks.map((t) => t.id);

    // Get all submissions
    let submissions: { taskId: string; userId: string; status: string | null }[] = [];
    if (taskIds.length > 0) {
      submissions = await db
        .select({ taskId: taskSubmissions.taskId, userId: taskSubmissions.userId, status: taskSubmissions.status })
        .from(taskSubmissions)
        .where(and(eq(taskSubmissions.instanceId, instanceId), inArray(taskSubmissions.taskId, taskIds)));
    }

    const totalTasks = tasks.length;
    const requiredTasks = tasks.filter((t) => t.isRequired === 1).length;

    const enriched = participants.map((p) => {
      const user = userMap[p.userId];
      const userSubs = submissions.filter((s) => s.userId === p.userId);
      const approvedCount = userSubs.filter((s) => s.status === "approved").length;
      const submittedCount = userSubs.length;
      const currentStage = stages.find((s) => s.id === p.currentStageId);

      return {
        id: p.id,
        userId: p.userId,
        name: user?.name || p.userId,
        email: user?.email || "",
        role: p.role,
        status: p.status,
        joinedAt: p.joinedAt,
        completedAt: p.completedAt,
        currentStage: currentStage?.name || null,
        currentStageOrder: currentStage?.sortOrder ?? 0,
        progress: totalTasks > 0 ? Math.round((approvedCount / totalTasks) * 100) : 0,
        submittedCount,
        approvedCount,
        totalTasks,
        requiredTasks,
      };
    });

    return NextResponse.json({
      instance,
      participants: enriched,
      stages: stages.map((s) => ({ id: s.id, name: s.name, sortOrder: s.sortOrder })),
    });
  } catch (error) {
    console.error("Failed to fetch participants:", error);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }
}

// POST — add participants to existing instance
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { id: instanceId } = await params;

    const instance = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, instanceId),
    });
    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    const body = await request.json();
    const { user_ids } = body as { user_ids: string[] };

    if (!user_ids || user_ids.length === 0) {
      return NextResponse.json({ error: "user_ids required" }, { status: 400 });
    }

    // Get first stage for initial placement
    const stages = await db.query.journeyStages.findMany({
      where: eq(journeyStages.journeyId, instance.journeyId),
      orderBy: (s, { asc }) => [asc(s.sortOrder)],
    });
    const firstStageId = stages[0]?.id || null;

    // Check existing participants to avoid duplicates
    const existing = await db.query.journeyParticipants.findMany({
      where: eq(journeyParticipants.instanceId, instanceId),
    });
    const existingUserIds = new Set(existing.map((p) => p.userId));

    const now = new Date().toISOString();
    let added = 0;

    for (const userId of user_ids) {
      if (existingUserIds.has(userId)) continue;
      await db.insert(journeyParticipants).values({
        id: crypto.randomUUID().slice(0, 8),
        instanceId,
        userId,
        role: "participant",
        status: "active",
        currentStageId: firstStageId,
        completedAt: null,
        joinedAt: now,
      });
      added++;
    }

    return NextResponse.json({ added }, { status: 201 });
  } catch (error) {
    console.error("Failed to add participants:", error);
    return NextResponse.json({ error: "Failed to add participants" }, { status: 500 });
  }
}

// DELETE — remove participant from instance
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const participantId = url.searchParams.get("participantId");

    if (!participantId) {
      return NextResponse.json({ error: "participantId required" }, { status: 400 });
    }

    await db.delete(journeyParticipants).where(eq(journeyParticipants.id, participantId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to remove participant:", error);
    return NextResponse.json({ error: "Failed to remove participant" }, { status: 500 });
  }
}
