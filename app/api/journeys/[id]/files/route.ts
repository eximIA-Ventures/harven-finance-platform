import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeyFiles, journeys } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const files = await db
      .select()
      .from(journeyFiles)
      .where(eq(journeyFiles.journeyId, id))
      .orderBy(asc(journeyFiles.createdAt));

    return NextResponse.json(files);
  } catch (error) {
    console.error("Failed to list journey files:", error);
    return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { id } = await params;

    const journey = await db.query.journeys.findFirst({
      where: eq(journeys.id, id),
    });
    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, fileUrl, fileName, fileType, fileSize } = body;

    if (!name || !fileUrl || !fileName) {
      return NextResponse.json({ error: "name, fileUrl and fileName are required" }, { status: 400 });
    }

    const fileId = crypto.randomUUID().slice(0, 8);

    await db.insert(journeyFiles).values({
      id: fileId,
      journeyId: id,
      name,
      description: description || null,
      fileUrl,
      fileName,
      fileType: fileType || null,
      fileSize: fileSize || null,
      uploadedBy: auth.user.id,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: fileId }, { status: 201 });
  } catch (error) {
    console.error("Failed to add journey file:", error);
    return NextResponse.json({ error: "Failed to add file" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    await db.delete(journeyFiles).where(eq(journeyFiles.id, fileId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete journey file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
