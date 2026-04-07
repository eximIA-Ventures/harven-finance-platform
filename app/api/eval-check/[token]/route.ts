import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { humanEvaluators } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`eval-check:${ip}`, { max: 20, windowSec: 60 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { token } = await params;
  const evaluator = await db.query.humanEvaluators.findFirst({
    where: eq(humanEvaluators.accessToken, token),
  });
  if (!evaluator) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
