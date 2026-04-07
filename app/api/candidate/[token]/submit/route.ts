import { NextResponse } from "next/server";
import { submitCase } from "@/lib/actions/candidates";
import { validate, submitCaseSchema } from "@/lib/validations";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`submit:${ip}`, { max: 5, windowSec: 300 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em breve." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const v = validate(submitCaseSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const id = await submitCase({
      candidateId: v.data.candidateId,
      teamId: v.data.teamId ?? null,
      phaseId: v.data.phaseId,
      rawText: v.data.rawText,
      fileName: v.data.fileName ?? "submission.txt",
      aiUsage: v.data.aiUsage ?? "none",
      aiUsageDescription: v.data.aiUsageDescription ?? "",
    });
    return NextResponse.json({ id });
  } catch (error) {
    console.error("Failed to submit:", error);
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}
