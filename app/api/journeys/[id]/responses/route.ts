import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  journeys,
  journeyStages,
  journeyTasks,
  journeyInstances,
  journeyParticipants,
  taskSubmissions,
  taskReviews,
  users,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { id: journeyId } = await params;

    // Get journey with stages and tasks
    const journey = await db.query.journeys.findFirst({
      where: eq(journeys.id, journeyId),
    });
    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    const stages = await db.query.journeyStages.findMany({
      where: eq(journeyStages.journeyId, journeyId),
      orderBy: (s, { asc }) => [asc(s.sortOrder)],
    });

    const stageIds = stages.map((s) => s.id);
    if (stageIds.length === 0) {
      return NextResponse.json({ journey, stages: [], submissions: [] });
    }

    const tasks = await db.query.journeyTasks.findMany({
      where: inArray(journeyTasks.stageId, stageIds),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });

    const taskIds = tasks.map((t) => t.id);
    if (taskIds.length === 0) {
      return NextResponse.json({ journey, stages: stages.map(s => ({ ...s, tasks: [] })), submissions: [] });
    }

    // Get all active instances
    const instances = await db.query.journeyInstances.findMany({
      where: eq(journeyInstances.journeyId, journeyId),
    });

    const instanceIds = instances.map((i) => i.id);
    if (instanceIds.length === 0) {
      return NextResponse.json({
        journey,
        stages: stages.map((s) => ({
          ...s,
          tasks: tasks.filter((t) => t.stageId === s.id),
        })),
        submissions: [],
        participants: [],
        instances,
      });
    }

    // Get all submissions for these tasks across all instances
    const submissions = await db.query.taskSubmissions.findMany({
      where: and(
        inArray(taskSubmissions.instanceId, instanceIds),
        inArray(taskSubmissions.taskId, taskIds)
      ),
    });

    // Get reviews for these submissions
    const submissionIds = submissions.map((s) => s.id);
    let reviews: typeof taskReviews.$inferSelect[] = [];
    if (submissionIds.length > 0) {
      reviews = await db.query.taskReviews.findMany({
        where: inArray(taskReviews.submissionId, submissionIds),
      });
    }

    // Get all participants
    const participants = await db.query.journeyParticipants.findMany({
      where: inArray(journeyParticipants.instanceId, instanceIds),
    });

    // Get user names
    const userIds = [...new Set([
      ...participants.map((p) => p.userId),
      ...submissions.map((s) => s.userId),
    ])];

    let userMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const userRows = await db.query.users.findMany({
        where: inArray(users.id, userIds),
        columns: { id: true, name: true },
      });
      userMap = Object.fromEntries(userRows.map((u) => [u.id, u.name]));
    }

    // Assemble response
    const stagesWithTasks = stages.map((s) => ({
      ...s,
      tasks: tasks
        .filter((t) => t.stageId === s.id)
        .map((t) => ({
          ...t,
          config: t.config ? JSON.parse(t.config) : null,
        })),
    }));

    const enrichedSubmissions = submissions.map((s) => ({
      ...s,
      userName: userMap[s.userId] || s.userId,
      reviews: reviews.filter((r) => r.submissionId === s.id),
      instanceName: instances.find((i) => i.id === s.instanceId)?.name || "",
    }));

    return NextResponse.json({
      journey,
      stages: stagesWithTasks,
      submissions: enrichedSubmissions,
      participants: participants.map((p) => ({
        ...p,
        userName: userMap[p.userId] || p.userId,
        instanceName: instances.find((i) => i.id === p.instanceId)?.name || "",
      })),
      instances,
    });
  } catch (error) {
    console.error("Failed to fetch responses:", error);
    return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 });
  }
}
