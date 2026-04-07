import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { compId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.organizer !== undefined) updates.organizer = body.organizer;
    if (body.description !== undefined) updates.description = body.description;
    if (body.competition_type !== undefined) updates.competitionType = body.competition_type;
    if (body.start_date !== undefined) updates.startDate = body.start_date;
    if (body.end_date !== undefined) updates.endDate = body.end_date;
    if (body.result !== undefined) updates.result = body.result;
    if (body.placement !== undefined) updates.placement = body.placement;
    if (body.team_members !== undefined) updates.teamMembers = body.team_members;
    if (body.documents !== undefined) updates.documents = body.documents;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await db.update(competitions).set(updates).where(eq(competitions.id, compId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update competition:", error);
    return NextResponse.json({ error: "Failed to update competition" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { compId } = await params;
    await db.delete(competitions).where(eq(competitions.id, compId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete competition:", error);
    return NextResponse.json({ error: "Failed to delete competition" }, { status: 500 });
  }
}
