import { NextResponse } from "next/server";
import { createEvaluation, listEvaluations } from "@/lib/actions/evaluations";
import { requireMember } from "@/lib/api-auth";
import { validate, createEvaluationSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const evals = await listEvaluations();
    return NextResponse.json(evals);
  } catch (error) {
    console.error("Failed to list evaluations:", error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(createEvaluationSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const id = await createEvaluation(body);
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Failed to create evaluation:", error);
    return NextResponse.json({ error: "Failed to create evaluation" }, { status: 500 });
  }
}
