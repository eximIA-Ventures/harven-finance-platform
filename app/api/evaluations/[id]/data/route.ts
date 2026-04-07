import { NextResponse } from "next/server";
import { getEvaluationFull } from "@/lib/actions/evaluations";
import { requireMember } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const data = await getEvaluationFull(id);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get evaluation data:", error);
    return NextResponse.json({ error: "Failed to get data" }, { status: 500 });
  }
}
