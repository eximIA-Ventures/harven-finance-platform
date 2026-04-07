import { NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no minimo 6 caracteres" }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        passwordHash: hashPassword(newPassword),
        mustChangePassword: 0,
      })
      .where(eq(users.id, session.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Change password failed:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
