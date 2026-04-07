import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  journeys,
  journeyInstances,
  journeyParticipants,
  journeyStages,
} from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";

// POST: Self-enroll — participant creates a group (instance) and invites members
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { id } = await params;

    // Verify journey exists and allows self-enrollment
    const journey = await db.query.journeys.findFirst({
      where: eq(journeys.id, id),
    });

    if (!journey) {
      return NextResponse.json({ error: "Jornada não encontrada" }, { status: 404 });
    }

    if (journey.selfEnroll !== 1) {
      return NextResponse.json(
        { error: "Esta jornada não permite inscrição livre" },
        { status: 403 }
      );
    }

    if (journey.status !== "active") {
      return NextResponse.json(
        { error: "Esta jornada não está ativa" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { groupName, memberIds } = body;

    if (!groupName || typeof groupName !== "string" || groupName.trim().length < 1) {
      return NextResponse.json({ error: "Nome do grupo é obrigatório" }, { status: 400 });
    }

    // memberIds: array of user IDs to invite (can be empty — creator is always added)
    const allParticipantIds = new Set<string>([auth.user.id]);
    if (Array.isArray(memberIds)) {
      for (const mid of memberIds) {
        if (typeof mid === "string" && mid.length > 0) {
          allParticipantIds.add(mid);
        }
      }
    }

    // Get first stage
    const firstStage = await db
      .select({ id: journeyStages.id })
      .from(journeyStages)
      .where(eq(journeyStages.journeyId, id))
      .orderBy(asc(journeyStages.sortOrder))
      .limit(1);

    const firstStageId = firstStage.length > 0 ? firstStage[0].id : null;

    const instanceId = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(journeyInstances).values({
      id: instanceId,
      journeyId: id,
      name: groupName.trim(),
      status: "active",
      startDate: now,
      endDate: null,
      mentorId: null,
      nucleusId: null,
      metadata: null,
      createdBy: auth.user.id,
      createdAt: now,
      updatedAt: now,
    });

    for (const userId of allParticipantIds) {
      await db.insert(journeyParticipants).values({
        id: crypto.randomUUID().slice(0, 8),
        instanceId,
        userId,
        role: "participant",
        status: "active",
        currentStageId: firstStageId,
        completedAt: null,
        joinedAt: now,
      });
    }

    return NextResponse.json({ id: instanceId }, { status: 201 });
  } catch (error) {
    console.error("Self-enroll failed:", error);
    return NextResponse.json({ error: "Erro ao criar grupo" }, { status: 500 });
  }
}
