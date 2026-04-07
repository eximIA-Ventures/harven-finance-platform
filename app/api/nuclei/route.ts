import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nuclei, users, nucleusProjects } from "@/lib/db/schema";
import { eq, asc, sql } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";

export async function GET() {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const list = await db.query.nuclei.findMany({
      orderBy: [asc(nuclei.name)],
    });

    const enriched = await Promise.all(
      list.map(async (n) => {
        const [memberCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(eq(users.nucleusId, n.id));

        const [projectCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(nucleusProjects)
          .where(eq(nucleusProjects.nucleusId, n.id));

        let coordinatorName: string | null = null;
        if (n.coordinatorId) {
          const coordinator = await db.query.users.findFirst({
            where: eq(users.id, n.coordinatorId),
          });
          coordinatorName = coordinator?.name || null;
        }

        return {
          ...n,
          members: Number(memberCount?.count || 0),
          projects: Number(projectCount?.count || 0),
          coordinatorName,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Failed to list nuclei:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const id = crypto.randomUUID().slice(0, 8);

    await db.insert(nuclei).values({
      id,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-"),
      description: body.description || null,
      color: body.color || "#C4A882",
      coordinatorId: body.coordinator_id || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Failed to create nucleus:", error);
    return NextResponse.json({ error: "Failed to create nucleus" }, { status: 500 });
  }
}
