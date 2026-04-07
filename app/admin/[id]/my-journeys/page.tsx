"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Route,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface InstanceCard {
  id: string;
  journeyId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  journeyName: string | null;
  journeyType: string | null;
  journeyColor: string | null;
  participantCount: number;
  totalTasks: number;
  approvedCount: number;
  progressPercent: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "danger" | "accent" | "default" }> = {
  active: { label: "Em andamento", variant: "success" },
  completed: { label: "Concluida", variant: "accent" },
  paused: { label: "Pausada", variant: "warning" },
  archived: { label: "Arquivada", variant: "default" },
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MyJourneysPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;

  const [instances, setInstances] = useState<InstanceCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/journey-instances");
      if (res.ok) setInstances(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const active = instances.filter((i) => i.status === "active");
  const completed = instances.filter((i) => i.status === "completed");
  const other = instances.filter((i) => i.status !== "active" && i.status !== "completed");

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif">Minhas Jornadas</h2>
        <p className="text-dim text-sm mt-1">
          {loading
            ? "Carregando..."
            : `${active.length} ativa${active.length !== 1 ? "s" : ""} · ${completed.length} concluida${completed.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span className="ml-2 text-sm text-dim">Carregando jornadas...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && instances.length === 0 && (
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <Route className="w-8 h-8 text-dim/40 mx-auto mb-3" />
              <p className="text-dim text-sm">
                Voce ainda nao participa de nenhuma jornada.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active journeys */}
      {!loading && active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" />
            Em andamento
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((inst) => (
              <JourneyCard
                key={inst.id}
                instance={inst}
                onClick={() =>
                  router.push(`/admin/${evalId}/my-journeys/${inst.id}`)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {!loading && completed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-success" />
            Concluidas
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completed.map((inst) => (
              <JourneyCard
                key={inst.id}
                instance={inst}
                onClick={() =>
                  router.push(`/admin/${evalId}/my-journeys/${inst.id}`)
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Other */}
      {!loading && other.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-cream flex items-center gap-2">
            <Layers className="w-4 h-4 text-dim" />
            Outras
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {other.map((inst) => (
              <JourneyCard
                key={inst.id}
                instance={inst}
                onClick={() =>
                  router.push(`/admin/${evalId}/my-journeys/${inst.id}`)
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Journey Card ───────────────────────────────────────────────────────────

function JourneyCard({
  instance,
  onClick,
}: {
  instance: InstanceCard;
  onClick: () => void;
}) {
  const s = statusBadge[instance.status] || statusBadge.active;

  return (
    <button
      onClick={onClick}
      className="text-left bg-bg-card rounded-2xl border border-[var(--border-color)] p-5 hover:border-accent/20 hover:shadow-card transition-all group"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: instance.journeyColor || "#C4A882",
              }}
            />
            <span className="text-sm font-semibold text-cream truncate">
              {instance.journeyName || instance.name}
            </span>
          </div>
          <Badge variant={s.variant} className="text-[10px] px-1.5 py-0 flex-shrink-0">
            {s.label}
          </Badge>
        </div>

        {/* Instance name (if different from journey) */}
        {instance.journeyName && instance.name !== instance.journeyName && (
          <p className="text-xs text-dim truncate">{instance.name}</p>
        )}

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-dim">Progresso</span>
            <span className="text-[10px] text-cream font-medium">
              {instance.progressPercent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                instance.progressPercent === 100 ? "bg-success" : "bg-accent"
              }`}
              style={{ width: `${instance.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-dim">
            {instance.approvedCount}/{instance.totalTasks} tarefas
          </span>
          <span className="text-xs text-accent font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Continuar
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );
}
