import { NextResponse } from "next/server";
import { login, getRedirectForRole } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validate, loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(`login:${ip}`, { max: 5, windowSec: 60 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em breve." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const v = validate(loginSchema, body);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const user = await login(v.data.email, v.data.password);
    if (!user) {
      return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });
    }

    // Force password change on first login
    if (user.mustChangePassword) {
      return NextResponse.json({
        user: { id: user.id, name: user.name, type: user.type, permissions: user.permissions },
        redirectTo: "/change-password",
        mustChangePassword: true,
      });
    }

    const redirectTo = getRedirectForRole(user);

    return NextResponse.json({
      user: { id: user.id, name: user.name, type: user.type, permissions: user.permissions },
      redirectTo,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
