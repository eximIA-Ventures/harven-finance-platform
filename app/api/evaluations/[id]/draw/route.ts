import { NextResponse } from "next/server";
import { drawTeams } from "@/lib/actions/evaluations";
import { requireMember } from "@/lib/api-auth";
import { validate, drawTeamsSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(drawTeamsSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const result = await drawTeams(id, v.data.teamCount, v.data.constraints);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to draw teams:", error);
    return NextResponse.json({ error: "Draw failed" }, { status: 500 });
  }
}
