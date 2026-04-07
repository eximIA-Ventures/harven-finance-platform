import { NextResponse } from "next/server";
import { addHumanEvaluator } from "@/lib/actions/evaluations";
import { createMember } from "@/lib/actions/users";
import { requireMember } from "@/lib/api-auth";
import { validate, addEvaluatorSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireMember("manage_eval");
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const v = validate(addEvaluatorSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const result = await addHumanEvaluator(id, { name: v.data.name, email: v.data.email, role: v.data.role });

    await createMember(id, {
      name: v.data.name,
      email: v.data.email,
      password: v.data.password || "harven2026",
      permissions: ["evaluate"],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
