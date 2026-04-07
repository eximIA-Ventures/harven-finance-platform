"use client";

import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function CandidateHeader({ name }: { name: string }) {
  return (
    <header className="border-b bg-bg-surface">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logos/harven-finance-dark.png" alt="Harven Finance" className="h-12 sidebar-logo" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-dim mr-2">{name}</span>
          <ThemeToggle />
          <button
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-danger/10 transition-colors"
            title="Sair"
          >
            <LogOut size={14} className="text-dim hover:text-danger" />
          </button>
        </div>
      </div>
    </header>
  );
}
