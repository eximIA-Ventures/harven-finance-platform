import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  kanbanCards,
  journeyInstances,
  journeyParticipants,
  users,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { validate, createKanbanCardSchema } from "@/lib/validations";

// ─── GET — list all kanban cards for this instance ──────────────────────────
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

    // Get all cards ordered by sortOrder
    const cards = await db
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
      .where(eq(kanbanCards.instanceId, id))
      .orderBy(asc(kanbanCards.sortOrder));

    return NextResponse.json(cards);
  } catch (error) {
    console.error("Failed to list kanban cards:", error);
    return NextResponse.json({ error: "Failed to list kanban cards" }, { status: 500 });
  }
}

// ─── POST — create a new kanban card ────────────────────────────────────────
export async function POST(
  request: Request,
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

    // Check user is a participant
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

    const body = await request.json();
    const v = validate(createKanbanCardSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    // Get max sortOrder for this status column
    const existing = await db
      .select({ sortOrder: kanbanCards.sortOrder })
      .from(kanbanCards)
      .where(
        and(
          eq(kanbanCards.instanceId, id),
          eq(kanbanCards.status, v.data.status || "todo")
        )
      )
      .orderBy(asc(kanbanCards.sortOrder));

    const maxSort = existing.length > 0
      ? Math.max(...existing.map((c) => c.sortOrder ?? 0))
      : -1;

    const cardId = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(kanbanCards).values({
      id: cardId,
      instanceId: id,
      title: v.data.title,
      description: v.data.description || null,
      status: v.data.status || "todo",
      priority: v.data.priority || "medium",
      assigneeId: v.data.assignee_id || null,
      stageId: v.data.stage_id || null,
      dueDate: v.data.due_date || null,
      sortOrder: maxSort + 1,
      createdBy: auth.user.id,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: cardId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create kanban card:", error);
    return NextResponse.json({ error: "Failed to create kanban card" }, { status: 500 });
  }
}
