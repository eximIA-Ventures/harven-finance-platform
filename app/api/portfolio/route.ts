import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { portfolioPositions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createPositionSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const rows = await db
      .select()
      .from(portfolioPositions)
      .orderBy(desc(portfolioPositions.createdAt));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to list portfolio positions:", error);
    return NextResponse.json({ error: "Failed to list portfolio positions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("admin");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(createPositionSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(portfolioPositions).values({
      id,
      ticker: v.data.ticker,
      companyName: v.data.company_name,
      positionType: v.data.position_type || "long",
      entryDate: v.data.entry_date,
      entryPrice: v.data.entry_price,
      quantity: v.data.quantity || 0,
      currentPrice: v.data.current_price || v.data.entry_price,
      thesis: v.data.thesis || null,
      thesisAuthor: v.data.thesis_author || null,
      status: "open",
      createdAt: now,
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Failed to create portfolio position:", error);
    return NextResponse.json({ error: "Failed to create portfolio position" }, { status: 500 });
  }
}
