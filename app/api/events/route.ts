import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, eventAttendees, eventFiles, users } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { validate, createEventSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const rows = await db
      .select()
      .from(events)
      .orderBy(desc(events.startDate));

    // Enrich with attendee count + list + current user status
    const enriched = await Promise.all(
      rows.map(async (event) => {
        const attendees = await db
          .select({
            id: eventAttendees.id,
            userId: eventAttendees.userId,
            status: eventAttendees.status,
            registeredAt: eventAttendees.registeredAt,
            userName: users.name,
            userAvatar: users.avatarUrl,
          })
          .from(eventAttendees)
          .leftJoin(users, eq(users.id, eventAttendees.userId))
          .where(eq(eventAttendees.eventId, event.id));

        const myAttendance = attendees.find((a) => a.userId === auth.user.id);

        // Get creator name
        let creatorName: string | null = null;
        if (event.createdBy) {
          const creator = await db.query.users.findFirst({
            where: eq(users.id, event.createdBy),
          });
          creatorName = creator?.name || null;
        }

        // Get files
        const files = await db
          .select()
          .from(eventFiles)
          .where(eq(eventFiles.eventId, event.id));

        return {
          ...event,
          attendeeCount: attendees.length,
          attendees: attendees.map((a) => ({
            userId: a.userId,
            name: a.userName,
            avatar: a.userAvatar,
            status: a.status,
          })),
          myStatus: myAttendance?.status || null,
          creatorName,
          files,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to list events:", error);
    return NextResponse.json({ error: "Failed to list events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Any authenticated member can create events (personal agenda)
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const raw = await request.json();
    // Convert empty strings to null for optional fields
    const body = Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, v === "" ? null : v])
    );
    const v = validate(createEventSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(events).values({
      id,
      title: v.data.title,
      description: v.data.description || null,
      eventType: v.data.event_type || "meeting",
      location: v.data.location || null,
      startDate: v.data.start_date,
      endDate: v.data.end_date || null,
      speaker: v.data.speaker || null,
      speakerTitle: v.data.speaker_title || null,
      maxAttendees: v.data.max_attendees || null,
      imageUrl: v.data.image_url || null,
      meetingUrl: v.data.meeting_url || null,
      locationType: v.data.location_type || "presencial",
      visibility: v.data.visibility || "all",
      createdBy: auth.user.id,
      createdAt: now,
    });

    // Auto-invite specified users
    if (v.data.invited_user_ids && v.data.invited_user_ids.length > 0) {
      for (const userId of v.data.invited_user_ids) {
        await db.insert(eventAttendees).values({
          id: crypto.randomUUID().slice(0, 8),
          eventId: id,
          userId,
          status: "invited",
          registeredAt: now,
        });
      }
    }

    // Creator auto-confirms
    await db.insert(eventAttendees).values({
      id: crypto.randomUUID().slice(0, 8),
      eventId: id,
      userId: auth.user.id,
      status: "confirmed",
      registeredAt: now,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
