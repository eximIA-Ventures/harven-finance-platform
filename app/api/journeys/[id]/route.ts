import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeys, journeyStages, journeyTasks, journeyFiles } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";
import { validate, updateJourneySchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const journey = await db.query.journeys.findFirst({
      where: eq(journeys.id, id),
    });

    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    const stages = await db
      .select()
      .from(journeyStages)
      .where(eq(journeyStages.journeyId, id))
      .orderBy(asc(journeyStages.sortOrder));

    const stagesWithTasks = await Promise.all(
      stages.map(async (stage) => {
        const tasks = await db
          .select()
          .from(journeyTasks)
          .where(eq(journeyTasks.stageId, stage.id))
          .orderBy(asc(journeyTasks.sortOrder));

        return {
          ...stage,
          tasks: tasks.map((t) => ({
            ...t,
            config: t.config ? JSON.parse(t.config) : null,
          })),
        };
      })
    );

    // Fetch shared files
    const files = await db
      .select()
      .from(journeyFiles)
      .where(eq(journeyFiles.journeyId, id))
      .orderBy(asc(journeyFiles.createdAt));

    return NextResponse.json({ ...journey, stages: stagesWithTasks, files });
  } catch (error) {
    console.error("Failed to get journey:", error);
    return NextResponse.json({ error: "Failed to get journey" }, { status: 500 });
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
    const v = validate(updateJourneySchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const existing = await db.query.journeys.findFirst({
      where: eq(journeys.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    await db
      .update(journeys)
      .set({
        ...(v.data.name !== undefined && { name: v.data.name }),
        ...(v.data.description !== undefined && { description: v.data.description }),
        ...(v.data.journey_type !== undefined && { journeyType: v.data.journey_type }),
        ...(v.data.color !== undefined && { color: v.data.color }),
        ...(v.data.icon !== undefined && { icon: v.data.icon }),
        ...(v.data.cover_image !== undefined && { coverImage: v.data.cover_image }),
        ...(v.data.status !== undefined && { status: v.data.status }),
        ...(v.data.self_enroll !== undefined && { selfEnroll: v.data.self_enroll ? 1 : 0 }),
        ...(v.data.estimated_days !== undefined && { estimatedDays: v.data.estimated_days }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(journeys.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update journey:", error);
    return NextResponse.json({ error: "Failed to update journey" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const existing = await db.query.journeys.findFirst({
      where: eq(journeys.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // Cascade: delete tasks → stages → journey
    const stages = await db
      .select({ id: journeyStages.id })
      .from(journeyStages)
      .where(eq(journeyStages.journeyId, id));

    for (const stage of stages) {
      await db.delete(journeyTasks).where(eq(journeyTasks.stageId, stage.id));
    }

    await db.delete(journeyStages).where(eq(journeyStages.journeyId, id));
    await db.delete(journeys).where(eq(journeys.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete journey:", error);
    return NextResponse.json({ error: "Failed to delete journey" }, { status: 500 });
  }
}
