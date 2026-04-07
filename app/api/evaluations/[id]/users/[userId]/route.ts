import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";
import { validate, updatePermissionsSchema } from "@/lib/validations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { userId } = await params;
    const body = await request.json();
    const v = validate(updatePermissionsSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (v.data.permissions) {
      updates.permissions = JSON.stringify(v.data.permissions);
    }
    if (v.data.memberStatus) {
      updates.memberStatus = v.data.memberStatus;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
