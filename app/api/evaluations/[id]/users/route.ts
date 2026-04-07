import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import { createMember } from "@/lib/actions/users";
import { requireMember } from "@/lib/api-auth";
import { validate, createUserSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    // Include users tied to this evaluation AND global members (no evaluationId)
    const evalUsers = await db.query.users.findMany({
      where: or(
        eq(users.evaluationId, id),
        isNull(users.evaluationId)
      ),
    });
    return NextResponse.json({ users: evalUsers });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_users");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(createUserSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const userId = await createMember(id, {
      name: v.data.name,
      email: v.data.email,
      password: v.data.password,
      permissions: (v.data.permissions || ["evaluate"]) as ("admin" | "evaluate" | "view_ranking" | "manage_users" | "manage_eval" | "view_reports")[],
    });
    return NextResponse.json({ id: userId });
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
