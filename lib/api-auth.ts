import { NextResponse } from "next/server";
import { getSession, hasPermission, type Permission, type SessionUser } from "./auth";

type AuthResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

/**
 * Require authenticated session with optional permission check.
 * Usage in API routes:
 *   const auth = await requireAuth("manage_eval");
 *   if (!auth.ok) return auth.response;
 *   const { user } = auth;
 */
export async function requireAuth(permission?: Permission): Promise<AuthResult> {
  const user = await getSession();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }

  if (permission && !hasPermission(user, permission)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Permissão insuficiente" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

/**
 * Require authenticated member (not candidate).
 */
export async function requireMember(permission?: Permission): Promise<AuthResult> {
  const auth = await requireAuth(permission);
  if (!auth.ok) return auth;

  if (auth.user.type !== "member") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Acesso restrito a membros" },
        { status: 403 }
      ),
    };
  }

  return auth;
}
