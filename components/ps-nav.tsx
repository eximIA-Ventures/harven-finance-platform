"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Shuffle, Sparkles } from "lucide-react";

export function PSNav({ evaluationId }: { evaluationId: string }) {
  const pathname = usePathname();

  const tabs = [
    { label: "Visao Geral", href: `/admin/${evaluationId}`, icon: <LayoutDashboard size={15} /> },
    { label: "Candidatos", href: `/admin/${evaluationId}/candidates`, icon: <Users size={15} /> },
    { label: "Sorteio", href: `/admin/${evaluationId}/draw`, icon: <Shuffle size={15} /> },
    { label: "Avaliacao", href: `/admin/${evaluationId}/evaluation`, icon: <Sparkles size={15} /> },
  ];

  return (
    <div className="flex gap-1 p-1 rounded-xl bg-bg-card ring-1 ring-[var(--border-color)]">
      {tabs.map((tab) => {
        const isActive = tab.href === `/admin/${evaluationId}`
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-all ${
              isActive
                ? "bg-accent/15 text-accent ring-1 ring-accent/20"
                : "text-dim hover:text-cream hover:bg-bg-surface"
            }`}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
