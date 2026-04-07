import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventAttendees } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { eventId } = await params;
    const userId = auth.user.id;

    const body = await request.json().catch(() => ({}));
    const status = body.status || "confirmed"; // "confirmed" | "maybe" | "declined"

    const existing = await db
      .select()
      .from(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId)
        )
      );

    if (existing.length > 0) {
      // Update status
      await db
        .update(eventAttendees)
        .set({ status })
        .where(eq(eventAttendees.id, existing[0].id));
      return NextResponse.json({ ok: true, status });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(eventAttendees).values({
      id,
      eventId,
      userId,
      status,
      registeredAt: now,
    });

    return NextResponse.json({ id, status }, { status: 201 });
  } catch (error) {
    console.error("Failed to register attendance:", error);
    return NextResponse.json({ error: "Failed to register attendance" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { eventId } = await params;
    const userId = auth.user.id;

    await db
      .delete(eventAttendees)
      .where(
        and(
          eq(eventAttendees.eventId, eventId),
          eq(eventAttendees.userId, userId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to unregister attendance:", error);
    return NextResponse.json({ error: "Failed to unregister attendance" }, { status: 500 });
  }
}
