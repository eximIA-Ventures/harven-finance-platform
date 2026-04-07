"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronRight, Clock, Archive, Loader2, XCircle } from "lucide-react";

interface Evaluation {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  deadline: string | null;
  createdAt: string;
}

const statusVariant: Record<string, "default" | "accent" | "warning" | "success"> = {
  draft: "default",
  open: "accent",
  evaluating: "warning",
  completed: "success",
};
const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  evaluating: "Avaliando",
  completed: "Concluido",
};

export default function PSListPage() {
  const [loading, setLoading] = useState(true);
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [closingId, setClosingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvaluations();
  }, []);

  async function loadEvaluations() {
    setLoading(true);
    try {
      const res = await fetch("/api/evaluations");
      const data = await res.json();
      setEvals(Array.isArray(data) ? data : []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(evalId: string) {
    setClosingId(evalId);
    try {
      const res = await fetch(`/api/evaluations/${evalId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        setEvals((prev) =>
          prev.map((e) => (e.id === evalId ? { ...e, status: "completed" } : e))
        );
      }
    } catch {
      // silent
    } finally {
      setClosingId(null);
    }
  }

  const active = evals.filter((e) => e.status !== "completed");
  const archived = evals.filter((e) => e.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-cream">Processos Seletivos</h1>
          <p className="text-dim text-sm mt-1">
            {active.length} ativo{active.length !== 1 ? "s" : ""} -- {archived.length} encerrado{archived.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/admin/new">
          <Button>
            <Plus size={16} />
            Novo Processo
          </Button>
        </Link>
      </div>

      {/* Active */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim mb-4 flex items-center gap-2">
          <Clock size={14} />
          Ativos
        </h2>

        {active.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-14 h-14 bg-accent/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Plus size={24} className="text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-cream mb-2">Nenhum processo ativo</h3>
              <p className="text-dim text-sm mb-6">Crie seu primeiro processo seletivo</p>
              <Link href="/admin/new">
                <Button>Criar Processo Seletivo</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {active.map((ev) => (
              <div key={ev.id} className="flex items-center gap-4 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-5 transition-all duration-200 hover:ring-accent/20 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                <Link href={`/admin/${ev.id}`} className="flex items-center gap-4 min-w-0 flex-1 group">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold text-lg font-mono">
                    PS
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-cream group-hover:text-accent transition-colors">
                      {ev.name}
                    </h3>
                    <p className="text-[11px] text-dim mt-0.5">
                      {ev.type} -- {new Date(ev.createdAt).toLocaleDateString("pt-BR")}
                      {ev.deadline && ` -- Prazo: ${new Date(ev.deadline).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                </Link>
                <Badge variant={statusVariant[ev.status] || "default"}>
                  {statusLabel[ev.status] || ev.status}
                </Badge>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose(ev.id);
                  }}
                  isLoading={closingId === ev.id}
                  disabled={closingId === ev.id}
                >
                  <XCircle size={12} />
                  Encerrar
                </Button>
                <Link href={`/admin/${ev.id}`}>
                  <ChevronRight size={16} className="text-dim/30 hover:text-accent transition-colors" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim mb-4 flex items-center gap-2">
            <Archive size={14} />
            Encerrados
          </h2>
          <div className="space-y-2">
            {archived.map((ev) => (
              <Link key={ev.id} href={`/admin/${ev.id}`} className="group block">
                <div className="flex items-center gap-4 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4 opacity-60 hover:opacity-100 transition-all">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dim/10 text-dim text-sm font-mono">
                    PS
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm text-cream">{ev.name}</h3>
                    <p className="text-[10px] text-dim">{new Date(ev.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Badge variant="success">Concluido</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
