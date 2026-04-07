"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Check, Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const isValid = password.length >= 6 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push("/admin"), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao alterar senha");
      }
    } catch {
      setError("Erro de conexao");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-cream">Senha alterada!</h2>
          <p className="text-sm text-dim">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <img src="/logos/harven-finance-dark.png" alt="Harven Finance" className="h-12 sidebar-logo" />
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-card p-6 sm:p-8 shadow-elevated">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Lock className="w-[18px] h-[18px] text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-cream">Primeiro acesso</h1>
              <p className="text-xs text-dim">Crie uma nova senha para sua conta</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-cream block mb-1.5">Nova senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="w-full px-4 py-3 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-cream transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <p className="text-[10px] text-warning mt-1">Minimo 6 caracteres</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-cream block mb-1.5">Confirmar senha</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-4 py-3 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
              />
              {confirm.length > 0 && password !== confirm && (
                <p className="text-[10px] text-danger mt-1">As senhas nao coincidem</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm text-danger">{error}</div>
            )}

            <button
              type="submit"
              disabled={!isValid || saving}
              className="w-full px-4 py-3 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Definir senha e entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
