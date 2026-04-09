import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeyTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { taskId } = await params;
    const body = await request.json();

    const existing = await db.query.journeyTasks.findFirst({
      where: eq(journeyTasks.id, taskId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db
      .update(journeyTasks)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.sort_order !== undefined && { sortOrder: body.sort_order }),
        ...(body.task_type !== undefined && { taskType: body.task_type }),
        ...(body.is_required !== undefined && { isRequired: body.is_required ? 1 : 0 }),
        ...(body.review_type !== undefined && { reviewType: body.review_type }),
        ...(body.config !== undefined && { config: body.config ? JSON.stringify(body.config) : null }),
        ...(body.max_score !== undefined && { maxScore: body.max_score }),
        ...(body.weight !== undefined && { weight: body.weight }),
        ...(body.material_url !== undefined && { materialUrl: body.material_url }),
        ...(body.material_file_name !== undefined && { materialFileName: body.material_file_name }),
        ...(body.material_file_size !== undefined && { materialFileSize: body.material_file_size }),
        ...(body.is_released !== undefined && { isReleased: body.is_released ? 1 : 0 }),
      })
      .where(eq(journeyTasks.id, taskId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { taskId } = await params;

    const existing = await db.query.journeyTasks.findFirst({
      where: eq(journeyTasks.id, taskId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.delete(journeyTasks).where(eq(journeyTasks.id, taskId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
