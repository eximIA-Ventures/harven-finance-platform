import { NextResponse } from "next/server";
import { getCandidateByToken } from "@/lib/actions/candidates";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`candidate:${ip}`, { max: 20, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em breve." },
        { status: 429 }
      );
    }

    const { token } = await params;
    const data = await getCandidateByToken(token);
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to get candidate:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
