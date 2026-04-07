import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  kanbanCards,
  journeyInstances,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { validate, updateKanbanCardSchema } from "@/lib/validations";
import { hasPermission } from "@/lib/auth";

// ─── PATCH — update a kanban card ───────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id, cardId } = await params;

    // Verify instance exists
    const instance = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, id),
    });

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    // Verify card exists and belongs to this instance
    const card = await db.query.kanbanCards.findFirst({
      where: eq(kanbanCards.id, cardId),
    });

    if (!card || card.instanceId !== id) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const body = await request.json();
    const v = validate(updateKanbanCardSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (v.data.title !== undefined) updates.title = v.data.title;
    if (v.data.description !== undefined) updates.description = v.data.description;
    if (v.data.status !== undefined) updates.status = v.data.status;
    if (v.data.priority !== undefined) updates.priority = v.data.priority;
    if (v.data.assignee_id !== undefined) updates.assigneeId = v.data.assignee_id;
    if (v.data.stage_id !== undefined) updates.stageId = v.data.stage_id;
    if (v.data.due_date !== undefined) updates.dueDate = v.data.due_date;
    if (v.data.sort_order !== undefined) updates.sortOrder = v.data.sort_order;

    await db
      .update(kanbanCards)
      .set(updates)
      .where(eq(kanbanCards.id, cardId));

    // Return updated card with assignee info
    const updated = await db
      .select({
        id: kanbanCards.id,
        instanceId: kanbanCards.instanceId,
        title: kanbanCards.title,
        description: kanbanCards.description,
        status: kanbanCards.status,
        priority: kanbanCards.priority,
        assigneeId: kanbanCards.assigneeId,
        stageId: kanbanCards.stageId,
        dueDate: kanbanCards.dueDate,
        sortOrder: kanbanCards.sortOrder,
        createdBy: kanbanCards.createdBy,
        createdAt: kanbanCards.createdAt,
        updatedAt: kanbanCards.updatedAt,
        assigneeName: users.name,
        assigneeAvatar: users.avatarUrl,
      })
      .from(kanbanCards)
      .leftJoin(users, eq(users.id, kanbanCards.assigneeId))
      .where(eq(kanbanCards.id, cardId));

    return NextResponse.json(updated[0] || { ok: true });
  } catch (error) {
    console.error("Failed to update kanban card:", error);
    return NextResponse.json({ error: "Failed to update kanban card" }, { status: 500 });
  }
}

// ─── DELETE — remove a kanban card ──────────────────────────────────────────
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id, cardId } = await params;

    // Verify instance exists
    const instance = await db.query.journeyInstances.findFirst({
      where: eq(journeyInstances.id, id),
    });

    if (!instance) {
      return NextResponse.json({ error: "Instance not found" }, { status: 404 });
    }

    // Verify card exists and belongs to this instance
    const card = await db.query.kanbanCards.findFirst({
      where: eq(kanbanCards.id, cardId),
    });

    if (!card || card.instanceId !== id) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Only the creator or an admin can delete
    const isCreator = card.createdBy === auth.user.id;
    const isAdmin = hasPermission(auth.user, "admin");

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Apenas o criador ou admin pode excluir" },
        { status: 403 }
      );
    }

    await db.delete(kanbanCards).where(eq(kanbanCards.id, cardId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete kanban card:", error);
    return NextResponse.json({ error: "Failed to delete kanban card" }, { status: 500 });
  }
}
