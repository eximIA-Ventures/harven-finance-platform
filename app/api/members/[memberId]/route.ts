import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireMember } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { memberId } = await params;

    // Users can view their own profile; admins/managers can view anyone
    const isOwnProfile = auth.user.id === memberId;
    const isPrivileged = auth.user.permissions.includes("admin") || auth.user.permissions.includes("manage_users");

    const member = await db.query.users.findFirst({
      where: eq(users.id, memberId),
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Non-privileged users can only see basic public info of others
    if (!isOwnProfile && !isPrivileged) {
      return NextResponse.json({
        id: member.id,
        name: member.name,
        memberStatus: member.memberStatus,
        course: member.course,
        avatarUrl: member.avatarUrl,
      });
    }

    return NextResponse.json({
      id: member.id,
      name: member.name,
      email: member.email,
      course: member.course,
      semester: member.semester,
      memberStatus: member.memberStatus,
      nucleusId: member.nucleusId,
      joinedAt: member.joinedAt,
      linkedinUrl: member.linkedinUrl,
      bio: member.bio,
    });
  } catch (error) {
    console.error("Failed to get member:", error);
    return NextResponse.json({ error: "Failed to get member" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const { memberId } = await params;

    // Users can edit their own profile; admins and diretoria can edit anyone
    const isDiretoria = ["presidente", "vice-presidente"].includes(auth.user.memberStatus || "");
    const canEdit = auth.user.id === memberId || auth.user.permissions.includes("admin") || auth.user.permissions.includes("manage_users") || isDiretoria;
    if (!canEdit) {
      return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
    }

    const body = await request.json();

    const allowedFields = [
      "course", "semester", "memberStatus", "nucleusId", "linkedinUrl",
      "bio", "anoIngresso", "sala", "instagram", "telefone",
      "empresa", "cargoEmpresa", "empresaSite", "empresaLinkedin",
      "empresaDescricao", "avatarUrl",
    ] as const;

    // Password reset (admin only, no email needed)
    if (body.newPassword) {
      if (!auth.user.permissions.includes("admin") && !auth.user.permissions.includes("manage_users") && !isDiretoria) {
        return NextResponse.json({ error: "Apenas admins e diretoria podem redefinir senhas" }, { status: 403 });
      }
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: "Senha deve ter no minimo 6 caracteres" }, { status: 400 });
      }
      await db.update(users).set({ passwordHash: hashPassword(body.newPassword) }).where(eq(users.id, memberId));
      return NextResponse.json({ ok: true, message: "Senha redefinida" });
    }

    const updates: Record<string, string | null> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await db.update(users).set(updates).where(eq(users.id, memberId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update member:", error);
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const auth = await requireMember("manage_users");
    if (!auth.ok) return auth.response;

    const { memberId } = await params;
    await db
      .update(users)
      .set({ memberStatus: "alumni" })
      .where(eq(users.id, memberId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to deactivate member:", error);
    return NextResponse.json({ error: "Failed to deactivate member" }, { status: 500 });
  }
}
