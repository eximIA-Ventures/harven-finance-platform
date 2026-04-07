import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  journeyInstances,
  journeyParticipants,
  journeys,
  journeyStages,
  journeyTasks,
  taskSubmissions,
} from "@/lib/db/schema";
import { desc, eq, asc, and } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createInstanceSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const rows = await db
      .select()
      .from(journeyInstances)
      .orderBy(desc(journeyInstances.createdAt));

    const enriched = await Promise.all(
      rows.map(async (instance) => {
        // Participant count
        const participants = await db
          .select({ id: journeyParticipants.id })
          .from(journeyParticipants)
          .where(eq(journeyParticipants.instanceId, instance.id));

        // Journey info
        const journey = await db.query.journeys.findFirst({
          where: eq(journeys.id, instance.journeyId),
        });

        // Total tasks in this journey
        const stages = await db
          .select({ id: journeyStages.id })
          .from(journeyStages)
          .where(eq(journeyStages.journeyId, instance.journeyId));

        let totalTasks = 0;
        for (const stage of stages) {
          const tasks = await db
            .select({ id: journeyTasks.id })
            .from(journeyTasks)
            .where(eq(journeyTasks.stageId, stage.id));
          totalTasks += tasks.length;
        }

        // Approved submissions for this instance
        const approvedSubmissions = await db
          .select({ id: taskSubmissions.id })
          .from(taskSubmissions)
          .where(
            and(
              eq(taskSubmissions.instanceId, instance.id),
              eq(taskSubmissions.status, "approved")
            )
          );

        const totalParticipantTasks = totalTasks * participants.length;
        const progressPercent =
          totalParticipantTasks > 0
            ? Math.round((approvedSubmissions.length / totalParticipantTasks) * 100)
            : 0;

        return {
          ...instance,
          journeyName: journey?.name || null,
          journeyType: journey?.journeyType || null,
          journeyColor: journey?.color || null,
          participantCount: participants.length,
          totalTasks,
          approvedCount: approvedSubmissions.length,
          progressPercent,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to list journey instances:", error);
    return NextResponse.json({ error: "Failed to list journey instances" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(createInstanceSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    // Verify journey exists
    const journey = await db.query.journeys.findFirst({
      where: eq(journeys.id, v.data.journey_id),
    });

    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // Get first stage for currentStageId
    const firstStage = await db
      .select({ id: journeyStages.id })
      .from(journeyStages)
      .where(eq(journeyStages.journeyId, v.data.journey_id))
      .orderBy(asc(journeyStages.sortOrder))
      .limit(1);

    const firstStageId = firstStage.length > 0 ? firstStage[0].id : null;

    const instanceId = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    // Insert instance
    await db.insert(journeyInstances).values({
      id: instanceId,
      journeyId: v.data.journey_id,
      name: v.data.name,
      status: "active",
      startDate: v.data.start_date,
      endDate: v.data.end_date || null,
      mentorId: v.data.mentor_id || null,
      nucleusId: v.data.nucleus_id || null,
      metadata: null,
      createdBy: auth.user.id,
      createdAt: now,
      updatedAt: now,
    });

    // Insert participants
    for (const userId of v.data.participant_ids) {
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
    }

    return NextResponse.json({ id: instanceId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create journey instance:", error);
    return NextResponse.json({ error: "Failed to create journey instance" }, { status: 500 });
  }
}
