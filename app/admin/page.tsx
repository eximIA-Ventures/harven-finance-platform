"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Calendar, Trophy, BookOpen, FileText, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardData {
  members: number;
  events: number;
  competitions: number;
  wikiPages: number;
  positions: Array<{ ticker: string; company_name: string; status: string; entry_price: number; current_price: number | null }>;
  upcomingEvents: Array<{ id: string; title: string; event_type: string; start_date: string; location: string | null }>;
  activePS: Array<{ id: string; name: string; status: string; deadline: string | null }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/members").then((r) => r.json()).catch(() => []),
      fetch("/api/events").then((r) => r.json()).catch(() => []),
      fetch("/api/competitions").then((r) => r.json()).catch(() => []),
      fetch("/api/wiki").then((r) => r.json()).catch(() => []),
      fetch("/api/portfolio").then((r) => r.json()).catch(() => []),
      fetch("/api/evaluations").then((r) => r.json()).catch(() => ({ evaluations: [] })),
    ]).then(([members, events, competitions, wiki, positions, evals]) => {
      const now = new Date().toISOString();
      setData({
        members: Array.isArray(members) ? members.length : 0,
        events: Array.isArray(events) ? events.length : 0,
        competitions: Array.isArray(competitions) ? competitions.length : 0,
        wikiPages: Array.isArray(wiki) ? wiki.length : 0,
        positions: Array.isArray(positions) ? positions.slice(0, 4) : [],
        upcomingEvents: Array.isArray(events) ? events.filter((e: Record<string, string>) => e.start_date > now).slice(0, 3) : [],
        activePS: Array.isArray(evals) ? evals : (evals.evaluations || []),
      });
    });
  }, []);

  const stats = [
    { label: "Membros", value: data?.members ?? "...", icon: <Users size={20} />, color: "bg-accent/15 text-accent", href: "/admin/ps-hf-2026/members" },
    { label: "Eventos", value: data?.events ?? "...", icon: <Calendar size={20} />, color: "bg-sage/15 text-sage", href: "/admin/ps-hf-2026/events" },
    { label: "Competicoes", value: data?.competitions ?? "...", icon: <Trophy size={20} />, color: "bg-atom/15 text-atom", href: "/admin/ps-hf-2026/competitions" },
    { label: "Wiki", value: data?.wikiPages ?? "...", icon: <BookOpen size={20} />, color: "bg-molecule/15 text-molecule", href: "/admin/ps-hf-2026/wiki" },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif text-cream">Dashboard</h1>
        <p className="text-dim text-sm mt-1">Harven Finance -- Visao geral da liga</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="group rounded-2xl bg-bg-card ring-1 ring-[var(--border-color)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:ring-accent/20">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                {s.icon}
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-dim">{s.label}</p>
              <p className="text-2xl font-bold text-cream">{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio resumo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Carteira da Liga</h2>
            <Link href="/admin/ps-hf-2026/portfolio" className="text-[10px] text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
              Ver tudo <ChevronRight size={10} />
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {data?.positions && data.positions.length > 0 ? (
                <div className="divide-y divide-white/[0.03]">
                  {data.positions.map((p, i) => {
                    const ret = p.current_price && p.entry_price ? ((p.current_price - p.entry_price) / p.entry_price) * 100 : null;
                    const isPositive = ret !== null && ret >= 0;
                    return (
                      <div key={i} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-cream font-mono">{p.ticker}</span>
                          <p className="text-[10px] text-dim">{p.company_name}</p>
                        </div>
                        <div className="text-right">
                          {ret !== null ? (
                            <div className={`flex items-center gap-1 ${isPositive ? "text-sage" : "text-danger"}`}>
                              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              <span className="text-sm font-mono font-medium">{ret.toFixed(1)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-dim">--</span>
                          )}
                          <Badge variant={p.status === "open" ? "accent" : p.status === "closed" ? "success" : "default"} className="mt-0.5">
                            {p.status === "open" ? "Aberta" : p.status === "closed" ? "Encerrada" : "Stopada"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-dim text-xs">Nenhuma posicao registrada</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Proximos eventos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Proximos Eventos</h2>
            <Link href="/admin/ps-hf-2026/events" className="text-[10px] text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
              Ver tudo <ChevronRight size={10} />
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              {data?.upcomingEvents && data.upcomingEvents.length > 0 ? (
                <div className="divide-y divide-white/[0.03]">
                  {data.upcomingEvents.map((e) => (
                    <div key={e.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex flex-col items-center justify-center shrink-0">
                        <span className="text-[8px] text-accent uppercase font-bold">
                          {new Date(e.start_date).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                        </span>
                        <span className="text-lg font-bold text-cream leading-none">
                          {new Date(e.start_date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-cream truncate">{e.title}</p>
                        <p className="text-[10px] text-dim">{e.location || "Local a definir"}</p>
                      </div>
                      <Badge variant="default">{e.event_type}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-dim text-xs">Nenhum evento proximo</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Processos Seletivos ativos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Processos Seletivos</h2>
          <Link href="/admin/ps" className="text-[10px] text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
            Ver todos <ChevronRight size={10} />
          </Link>
        </div>
        {data?.activePS && data.activePS.length > 0 ? (
          <div className="space-y-2">
            {data.activePS.map((ps: Record<string, string | null>) => (
              <Link key={ps.id} href={`/admin/${ps.id}`} className="group block">
                <div className="flex items-center gap-4 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4 transition-all duration-200 hover:ring-accent/20 hover:-translate-y-0.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                    <FileText size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-cream group-hover:text-accent transition-colors truncate">{ps.name}</h3>
                    <p className="text-[10px] text-dim">
                      {ps.deadline ? `Prazo: ${new Date(ps.deadline).toLocaleDateString("pt-BR")}` : "Sem prazo definido"}
                    </p>
                  </div>
                  <Badge variant={ps.status === "open" ? "accent" : ps.status === "completed" ? "success" : "default"}>
                    {ps.status === "open" ? "Aberto" : ps.status === "completed" ? "Concluido" : ps.status === "draft" ? "Rascunho" : (ps.status || "")}
                  </Badge>
                  <ChevronRight size={16} className="text-dim/30 group-hover:text-accent transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-dim text-xs">Nenhum processo seletivo</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
