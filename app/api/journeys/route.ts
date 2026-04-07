import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeys, journeyStages, journeyTasks, journeyInstances } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createJourneySchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const rows = await db
      .select({
        id: journeys.id,
        name: journeys.name,
        slug: journeys.slug,
        description: journeys.description,
        journeyType: journeys.journeyType,
        color: journeys.color,
        icon: journeys.icon,
        coverImage: journeys.coverImage,
        status: journeys.status,
        selfEnroll: journeys.selfEnroll,
        estimatedDays: journeys.estimatedDays,
        isTemplate: journeys.isTemplate,
        createdBy: journeys.createdBy,
        createdAt: journeys.createdAt,
        updatedAt: journeys.updatedAt,
        stageCount: sql<number>`count(distinct ${journeyStages.id})`.as("stage_count"),
        taskCount: sql<number>`count(distinct ${journeyTasks.id})`.as("task_count"),
      })
      .from(journeys)
      .leftJoin(journeyStages, eq(journeyStages.journeyId, journeys.id))
      .leftJoin(journeyTasks, eq(journeyTasks.stageId, journeyStages.id))
      .groupBy(journeys.id)
      .orderBy(desc(journeys.createdAt));

    // Enrich with active instance count per journey
    const instanceCounts = await db
      .select({
        journeyId: journeyInstances.journeyId,
        activeCount: sql<number>`count(*)`.as("active_count"),
      })
      .from(journeyInstances)
      .where(eq(journeyInstances.status, "active"))
      .groupBy(journeyInstances.journeyId);

    const instanceMap = new Map(instanceCounts.map(r => [r.journeyId, r.activeCount]));

    const enriched = rows.map(row => ({
      ...row,
      activeInstanceCount: instanceMap.get(row.id) || 0,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to list journeys:", error);
    return NextResponse.json({ error: "Failed to list journeys" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(createJourneySchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const slug = v.data.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    await db.insert(journeys).values({
      id,
      name: v.data.name,
      slug,
      description: v.data.description || null,
      journeyType: v.data.journey_type || "custom",
      color: v.data.color || "#C4A882",
      icon: v.data.icon || "route",
      coverImage: v.data.cover_image || null,
      status: v.data.status || "active",
      selfEnroll: v.data.self_enroll ? 1 : 0,
      estimatedDays: v.data.estimated_days || null,
      isTemplate: v.data.is_template === false ? 0 : 1,
      createdBy: auth.user.id,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create journey:", error);
    return NextResponse.json({ error: "Failed to create journey" }, { status: 500 });
  }
}
