import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskFiles, journeyTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { taskId } = await params;

    const files = await db.query.taskFiles.findMany({
      where: eq(taskFiles.taskId, taskId),
      orderBy: (f, { asc }) => [asc(f.sortOrder)],
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Failed to fetch task files:", error);
    return NextResponse.json({ error: "Failed to fetch task files" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { taskId } = await params;

    const task = await db.query.journeyTasks.findFirst({
      where: eq(journeyTasks.id, taskId),
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, fileUrl, fileName, fileType, fileSize } = body;

    if (!name || !fileUrl || !fileName) {
      return NextResponse.json({ error: "name, fileUrl, fileName required" }, { status: 400 });
    }

    const existing = await db.query.taskFiles.findMany({
      where: eq(taskFiles.taskId, taskId),
    });

    const fileId = crypto.randomUUID().slice(0, 8);

    await db.insert(taskFiles).values({
      id: fileId,
      taskId,
      name,
      fileUrl,
      fileName,
      fileType: fileType || null,
      fileSize: fileSize || null,
      sortOrder: existing.length,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: fileId }, { status: 201 });
  } catch (error) {
    console.error("Failed to add task file:", error);
    return NextResponse.json({ error: "Failed to add task file" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string; taskId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const fileId = url.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    await db.delete(taskFiles).where(eq(taskFiles.id, fileId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete task file:", error);
    return NextResponse.json({ error: "Failed to delete task file" }, { status: 500 });
  }
}
