import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";
import { validate, updateEvaluationSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(updateEvaluationSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    await db
      .update(evaluations)
      .set({
        name: body.name,
        description: body.description,
        instructions: body.instructions,
        deadline: body.deadline,
        status: body.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(evaluations.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(updateEvaluationSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.instructions !== undefined) updates.instructions = body.instructions;
    if (body.deadline !== undefined) updates.deadline = body.deadline;
    if (body.status !== undefined) updates.status = body.status;

    await db
      .update(evaluations)
      .set(updates)
      .where(eq(evaluations.id, id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to patch evaluation:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
