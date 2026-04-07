import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createCompetitionSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const rows = await db
      .select()
      .from(competitions)
      .orderBy(desc(competitions.startDate));
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to list competitions:", error);
    return NextResponse.json({ error: "Failed to list competitions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(createCompetitionSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(competitions).values({
      id,
      name: v.data.name,
      organizer: v.data.organizer || null,
      description: v.data.description || null,
      competitionType: v.data.competition_type || "case",
      startDate: v.data.start_date || null,
      endDate: v.data.end_date || null,
      result: v.data.result || null,
      placement: v.data.placement || null,
      teamMembers: v.data.team_members || null,
      createdAt: now,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Failed to create competition:", error);
    return NextResponse.json({ error: "Failed to create competition" }, { status: 500 });
  }
}
