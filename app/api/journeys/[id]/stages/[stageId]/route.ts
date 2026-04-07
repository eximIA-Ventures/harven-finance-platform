import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeyStages, journeyTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { stageId } = await params;
    const body = await request.json();

    const existing = await db.query.journeyStages.findFirst({
      where: eq(journeyStages.id, stageId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    await db
      .update(journeyStages)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.sort_order !== undefined && { sortOrder: body.sort_order }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.estimated_days !== undefined && { estimatedDays: body.estimated_days }),
        ...(body.unlock_rule !== undefined && { unlockRule: body.unlock_rule }),
      })
      .where(eq(journeyStages.id, stageId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update stage:", error);
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { stageId } = await params;

    const existing = await db.query.journeyStages.findFirst({
      where: eq(journeyStages.id, stageId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    // Delete tasks first, then stage
    await db.delete(journeyTasks).where(eq(journeyTasks.stageId, stageId));
    await db.delete(journeyStages).where(eq(journeyStages.id, stageId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete stage:", error);
    return NextResponse.json({ error: "Failed to delete stage" }, { status: 500 });
  }
}
