import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeyStages, journeyTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createJourneyTaskSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { stageId } = await params;

    const stage = await db.query.journeyStages.findFirst({
      where: eq(journeyStages.id, stageId),
    });

    if (!stage) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const body = await request.json();
    const v = validate(createJourneyTaskSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const taskId = crypto.randomUUID().slice(0, 8);

    await db.insert(journeyTasks).values({
      id: taskId,
      stageId,
      name: v.data.name,
      description: v.data.description || null,
      sortOrder: v.data.sort_order,
      taskType: v.data.task_type,
      isRequired: v.data.is_required === false ? 0 : 1,
      reviewType: v.data.review_type || "mentor",
      config: v.data.config ? JSON.stringify(v.data.config) : null,
      maxScore: v.data.max_score ?? 10,
      weight: v.data.weight ?? 1,
      materialUrl: v.data.material_url || null,
      materialFileName: v.data.material_file_name || null,
      materialFileSize: v.data.material_file_size || null,
      isReleased: v.data.is_released === false ? 0 : 1,
    });

    return NextResponse.json({ id: taskId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
