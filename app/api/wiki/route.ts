import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { wikiPages, users } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth, requireMember } from "@/lib/api-auth";
import { validate, createWikiPageSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const rows = await db
      .select()
      .from(wikiPages)
      .where(eq(wikiPages.isPublished, 1))
      .orderBy(desc(wikiPages.createdAt));

    // Enrich with author name
    const enriched = await Promise.all(
      rows.map(async (page) => {
        let authorName: string | null = null;
        if (page.authorId) {
          const author = await db.query.users.findFirst({ where: eq(users.id, page.authorId) });
          authorName = author?.name || null;
        }
        return {
          ...page,
          authorName,
          tags: page.tags ? JSON.parse(page.tags) : [],
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to list resources:", error);
    return NextResponse.json({ error: "Failed to list resources" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(createWikiPageSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const slug = v.data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db.insert(wikiPages).values({
      id,
      title: v.data.title,
      slug,
      content: v.data.content || "",
      category: v.data.category || "guides",
      resourceType: v.data.resource_type || "article",
      authorId: auth.user.id,
      isPublished: 1,
      sortOrder: v.data.sort_order || 0,
      fileUrl: v.data.file_url || null,
      fileName: v.data.file_name || null,
      fileType: v.data.file_type || null,
      externalUrl: v.data.external_url || null,
      coverColor: v.data.cover_color || "#C4A882",
      tags: v.data.tags ? JSON.stringify(v.data.tags) : null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, slug });
  } catch (error) {
    console.error("Failed to create resource:", error);
    return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
  }
}
