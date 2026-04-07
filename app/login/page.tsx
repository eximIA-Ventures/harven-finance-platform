"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const { redirectTo } = await res.json();
        router.push(redirectTo);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Credenciais inválidas");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/[0.02] blur-[120px]" />
      </div>
      <div className="absolute inset-0 dot-grid text-cream" />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo + product divider */}
        <div className="mb-10 flex flex-col items-center">
          <img
            src="/logos/harven-finance-dark.png"
            alt="Harven Finance"
            className="h-[100px] -ml-4"
          />
          <div className="mt-2 flex items-center gap-2 -ml-4">
            <div className="h-px w-8 bg-black/10" />
            <span className="text-[10px] font-semibold tracking-[0.35em] uppercase text-dim">Portal</span>
            <div className="h-px w-8 bg-black/10" />
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-surface/80 backdrop-blur-sm p-6 sm:p-8 shadow-2xl shadow-black/20">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <svg className="w-[18px] h-[18px] text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-cream">Bem-vindo</h1>
              <p className="text-xs text-dim">Entre para acessar sua área</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" isLoading={isLoading} className="w-full" size="md">
              Entrar
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Button>
          </form>

          <p className="mt-6 text-center text-[10px] text-dim/50">
            O sistema redirecionará automaticamente para sua área baseada nas suas permissões.
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-dim/50">
          Harven Finance Portal
        </p>
      </div>
    </div>
  );
}
