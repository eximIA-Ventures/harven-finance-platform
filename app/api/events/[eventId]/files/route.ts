import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventFiles, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { eventId } = await params;

    const files = await db
      .select()
      .from(eventFiles)
      .where(eq(eventFiles.eventId, eventId));

    return NextResponse.json(files);
  } catch (error) {
    console.error("Failed to list event files:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const { eventId } = await params;

    const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await request.json();
    const { name, fileUrl, fileName, fileType, fileSize } = body;
    if (!name || !fileUrl || !fileName) {
      return NextResponse.json({ error: "name, fileUrl, fileName required" }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    await db.insert(eventFiles).values({
      id,
      eventId,
      name,
      fileUrl,
      fileName,
      fileType: fileType || null,
      fileSize: fileSize || null,
      uploadedBy: auth.user.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Failed to add event file:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

    await db.delete(eventFiles).where(eq(eventFiles.id, fileId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete event file:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
