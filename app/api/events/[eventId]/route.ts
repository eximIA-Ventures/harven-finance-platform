import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { eventId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.event_type !== undefined) updates.eventType = body.event_type;
    if (body.location !== undefined) updates.location = body.location;
    if (body.start_date !== undefined) updates.startDate = body.start_date;
    if (body.end_date !== undefined) updates.endDate = body.end_date;
    if (body.speaker !== undefined) updates.speaker = body.speaker;
    if (body.speaker_title !== undefined) updates.speakerTitle = body.speaker_title;
    if (body.max_attendees !== undefined) updates.maxAttendees = body.max_attendees;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.update(events).set(updates).where(eq(events.id, eventId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update event:", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { eventId } = await params;
    await db.delete(events).where(eq(events.id, eventId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
