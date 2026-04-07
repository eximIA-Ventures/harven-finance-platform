import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeys, journeyStages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createStageSchema } from "@/lib/validations";

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
    const v = validate(createStageSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const stageId = crypto.randomUUID().slice(0, 8);

    await db.insert(journeyStages).values({
      id: stageId,
      journeyId: id,
      name: v.data.name,
      description: v.data.description || null,
      sortOrder: v.data.sort_order,
      color: v.data.color || "#C4A882",
      estimatedDays: v.data.estimated_days || null,
      unlockRule: v.data.unlock_rule || "sequential",
    });

    return NextResponse.json({ id: stageId }, { status: 201 });
  } catch (error) {
    console.error("Failed to create stage:", error);
    return NextResponse.json({ error: "Failed to create stage" }, { status: 500 });
  }
}
