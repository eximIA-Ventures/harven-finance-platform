import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, eq, isNotNull, asc, and, ne } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";
import { requireMember } from "@/lib/api-auth";
import { validate, createMemberSchema } from "@/lib/validations";

export async function GET() {
  try {
    const auth = await requireMember();
    if (!auth.ok) return auth.response;

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        course: users.course,
        semester: users.semester,
        memberStatus: users.memberStatus,
        nucleusId: users.nucleusId,
        joinedAt: users.joinedAt,
        linkedinUrl: users.linkedinUrl,
        bio: users.bio,
        anoIngresso: users.anoIngresso,
        sala: users.sala,
        instagram: users.instagram,
        telefone: users.telefone,
        empresa: users.empresa,
        cargoEmpresa: users.cargoEmpresa,
        empresaSite: users.empresaSite,
        empresaLinkedin: users.empresaLinkedin,
        empresaDescricao: users.empresaDescricao,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(and(
        or(eq(users.type, "member"), isNotNull(users.memberStatus)),
        ne(users.id, "admin-hugo")
      ))
      .orderBy(asc(users.name));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Failed to list members:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireMember("manage_users");
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const v = validate(createMemberSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, v.data.email.toLowerCase().trim()),
    });
    if (existing) {
      return NextResponse.json({ error: "Email ja registrado" }, { status: 409 });
    }

    const id = crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();

    await db.insert(users).values({
      id,
      email: v.data.email.toLowerCase().trim(),
      passwordHash: hashPassword(v.data.password),
      name: v.data.name,
      type: "member",
      permissions: "[]",
      createdAt: now,
      course: v.data.course || null,
      semester: v.data.semester || null,
      memberStatus: v.data.member_status || "trainee",
      joinedAt: v.data.joined_at || now,
      anoIngresso: v.data.ano_ingresso || null,
      sala: v.data.sala || null,
    });

    return NextResponse.json({ id });
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
