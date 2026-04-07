import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioPositions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireMember } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ posId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { posId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.current_price !== undefined) updates.currentPrice = body.current_price;
    if (body.exit_date !== undefined) updates.exitDate = body.exit_date;
    if (body.exit_price !== undefined) updates.exitPrice = body.exit_price;
    if (body.status !== undefined) updates.status = body.status;

    await db
      .update(portfolioPositions)
      .set(updates)
      .where(eq(portfolioPositions.id, posId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update portfolio position:", error);
    return NextResponse.json({ error: "Failed to update portfolio position" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ posId: string }> }
) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const { posId } = await params;
    await db
      .delete(portfolioPositions)
      .where(eq(portfolioPositions.id, posId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete portfolio position:", error);
    return NextResponse.json({ error: "Failed to delete portfolio position" }, { status: 500 });
  }
}
