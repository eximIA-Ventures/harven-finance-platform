import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiPages, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { pageId } = await params;

    const rows = await db
      .select()
      .from(wikiPages)
      .where(eq(wikiPages.id, pageId))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    const page = rows[0];
    let authorName: string | null = null;
    if (page.authorId) {
      const author = await db.query.users.findFirst({ where: eq(users.id, page.authorId) });
      authorName = author?.name || null;
    }

    return NextResponse.json({
      ...page,
      authorName,
      tags: page.tags ? JSON.parse(page.tags) : [],
    });
  } catch (error) {
    console.error("Failed to get wiki page:", error);
    return NextResponse.json({ error: "Failed to get wiki page" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { pageId } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    const updates: Record<string, unknown> = { updatedAt: now };
    if (body.title !== undefined) {
      updates.title = body.title;
      updates.slug = body.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    }
    if (body.content !== undefined) updates.content = body.content;
    if (body.category !== undefined) updates.category = body.category;
    if (body.resource_type !== undefined) updates.resourceType = body.resource_type;
    if (body.is_published !== undefined) updates.isPublished = body.is_published;
    if (body.sort_order !== undefined) updates.sortOrder = body.sort_order;
    if (body.file_url !== undefined) updates.fileUrl = body.file_url;
    if (body.file_name !== undefined) updates.fileName = body.file_name;
    if (body.file_type !== undefined) updates.fileType = body.file_type;
    if (body.external_url !== undefined) updates.externalUrl = body.external_url;
    if (body.cover_color !== undefined) updates.coverColor = body.cover_color;
    if (body.tags !== undefined) updates.tags = body.tags ? JSON.stringify(body.tags) : null;

    await db
      .update(wikiPages)
      .set(updates)
      .where(eq(wikiPages.id, pageId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update wiki page:", error);
    return NextResponse.json({ error: "Failed to update wiki page" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { pageId } = await params;
    await db.delete(wikiPages).where(eq(wikiPages.id, pageId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete wiki page:", error);
    return NextResponse.json({ error: "Failed to delete wiki page" }, { status: 500 });
  }
}
