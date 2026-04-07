"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, BookOpen, FileText, ChevronRight, Route, MapPin, Clock } from "lucide-react";

interface DashboardData {
  members: number;
  events: number;
  wikiPages: number;
  journeys: number;
  upcomingEvents: Array<{ id: string; title: string; event_type: string; start_date: string; end_date: string | null; location: string | null }>;
  activePS: Array<{ id: string; name: string; status: string; deadline: string | null }>;
}

function getEventEndTime(e: { start_date: string; end_date: string | null }): string {
  if (e.end_date) return e.end_date;
  // Default: 2 hours after start
  const start = new Date(e.start_date);
  start.setHours(start.getHours() + 2);
  return start.toISOString();
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/members").then((r) => r.json()).catch(() => []),
      fetch("/api/events").then((r) => r.json()).catch(() => []),
      fetch("/api/wiki").then((r) => r.json()).catch(() => []),
      fetch("/api/journeys").then((r) => r.json()).catch(() => []),
      fetch("/api/evaluations").then((r) => r.json()).catch(() => ({ evaluations: [] })),
    ]).then(([members, events, wiki, journeys, evals]) => {
      const now = new Date().toISOString();
      setData({
        members: Array.isArray(members) ? members.length : 0,
        events: Array.isArray(events) ? events.length : 0,
        wikiPages: Array.isArray(wiki) ? wiki.length : 0,
        journeys: Array.isArray(journeys) ? journeys.filter((j: { status: string | null }) => j.status !== "draft").length : 0,
        upcomingEvents: Array.isArray(events)
          ? events
              .filter((e: { start_date: string; end_date: string | null }) => getEventEndTime(e) > now)
              .sort((a: { start_date: string }, b: { start_date: string }) => a.start_date.localeCompare(b.start_date))
              .slice(0, 3)
          : [],
        activePS: Array.isArray(evals) ? evals : (evals.evaluations || []),
      });
    });
  }, []);

  const stats = [
    { label: "Membros", value: data?.members ?? "...", icon: <Users size={20} />, color: "bg-accent/15 text-accent", href: "/admin/ps-hf-2026/members" },
    { label: "Eventos", value: data?.events ?? "...", icon: <Calendar size={20} />, color: "bg-sage/15 text-sage", href: "/admin/ps-hf-2026/events" },
    { label: "Jornadas", value: data?.journeys ?? "...", icon: <Route size={20} />, color: "bg-atom/15 text-atom", href: "/admin/ps-hf-2026/journeys" },
    { label: "Biblioteca", value: data?.wikiPages ?? "...", icon: <BookOpen size={20} />, color: "bg-molecule/15 text-molecule", href: "/admin/ps-hf-2026/wiki" },
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

      {/* Proximos eventos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Proximos Eventos</h2>
          <Link href="/admin/ps-hf-2026/events" className="text-[10px] text-accent hover:text-accent-hover transition-colors flex items-center gap-1">
            Ver agenda <ChevronRight size={10} />
          </Link>
        </div>
        {data?.upcomingEvents && data.upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {data.upcomingEvents.map((e) => {
              const startD = new Date(e.start_date);
              const isToday = startD.toDateString() === new Date().toDateString();
              return (
                <div key={e.id} className={`flex items-center gap-4 rounded-xl ring-1 p-4 transition-all duration-200 hover:-translate-y-0.5 ${isToday ? "ring-accent/30 bg-accent/[0.04]" : "ring-[var(--border-color)] bg-bg-card"}`}>
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? "bg-accent/15" : "bg-bg-elevated"}`}>
                    <span className={`text-[8px] uppercase font-bold ${isToday ? "text-accent" : "text-dim"}`}>
                      {startD.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                    </span>
                    <span className="text-lg font-bold text-cream leading-none">
                      {startD.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-cream truncate">{e.title}</p>
                      {isToday && <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">HOJE</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[10px] text-dim">
                        <Clock size={10} />
                        <span>{startD.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-1 text-[10px] text-dim">
                          <MapPin size={10} />
                          <span>{e.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-dim text-xs">Nenhum evento proximo</CardContent>
          </Card>
        )}
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
