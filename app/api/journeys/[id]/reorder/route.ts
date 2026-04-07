import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { journeyStages, journeyTasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";
import { validate, reorderSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    await params; // consume params to satisfy Next.js

    const body = await request.json();
    const v = validate(reorderSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    // Update stage sort orders
    if (v.data.stages && v.data.stages.length > 0) {
      for (const stage of v.data.stages) {
        await db
          .update(journeyStages)
          .set({ sortOrder: stage.sort_order })
          .where(eq(journeyStages.id, stage.id));
      }
    }

    // Update task sort orders
    if (v.data.tasks && v.data.tasks.length > 0) {
      for (const task of v.data.tasks) {
        await db
          .update(journeyTasks)
          .set({ sortOrder: task.sort_order })
          .where(eq(journeyTasks.id, task.id));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reorder:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
