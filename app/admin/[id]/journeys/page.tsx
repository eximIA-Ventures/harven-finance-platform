"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  Loader2,
  Clock,
  Layers,
  AlignLeft,
  Trash2,
  ListChecks,
  Compass,
  Lock,
  Users,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type JourneyType =
  | "case-competition"
  | "investment-thesis"
  | "trainee-onboarding"
  | "nucleus-project"
  | "capacitacao"
  | "custom";

interface JourneyRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  journeyType: string | null;
  color: string | null;
  icon: string | null;
  coverImage: string | null;
  status: string | null;
  selfEnroll: number | null;
  estimatedDays: number | null;
  isTemplate: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  stageCount: number;
  taskCount: number;
  activeInstanceCount: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  "case-competition": "Case Competition",
  "investment-thesis": "Investment Thesis",
  "trainee-onboarding": "Trainee Onboarding",
  "nucleus-project": "Nucleus Project",
  capacitacao: "Capacitacao",
  custom: "Custom",
};

const typeColors: Record<string, string> = {
  "case-competition": "bg-amber-500",
  "investment-thesis": "bg-blue-500",
  "trainee-onboarding": "bg-emerald-500",
  "nucleus-project": "bg-purple-500",
  capacitacao: "bg-teal-500",
  custom: "bg-amber-500",
};

const typeBadgeVariant: Record<
  string,
  "warning" | "info" | "success" | "accent" | "default"
> = {
  "case-competition": "warning",
  "investment-thesis": "info",
  "trainee-onboarding": "success",
  "nucleus-project": "accent",
  capacitacao: "info",
  custom: "default",
};

const PRESET_COLORS = [
  "#C4A882",
  "#EF4444",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
];

const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

// ─── Form ───────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  description: string;
  journey_type: JourneyType;
  estimated_days: string;
  color: string;
  self_enroll: boolean;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  journey_type: "custom",
  estimated_days: "",
  color: "#C4A882",
  self_enroll: false,
};

// ─── Modal ──────────────────────────────────────────────────────────────────

function CreateJourneyModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          journey_type: form.journey_type,
          estimated_days: form.estimated_days
            ? parseInt(form.estimated_days)
            : null,
          color: form.color,
          self_enroll: form.self_enroll,
        }),
      });
      if (res.ok) {
        onClose();
        onCreated();
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/25 backdrop-blur-[6px]"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
        style={{ animation: "modal-fade 0.2s ease-out" }}
      />

      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{
          animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-bg-card rounded-t-2xl border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: form.color }}
              />
              <h2 className="text-lg font-semibold text-cream truncate max-w-[300px]">
                {form.name || "Nova Jornada"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome da jornada"
              className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40"
            />

            {/* Type pills */}
            <div className="flex gap-2 flex-wrap">
              {(
                [
                  "case-competition",
                  "investment-thesis",
                  "trainee-onboarding",
                  "nucleus-project",
                  "capacitacao",
                  "custom",
                ] as const
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, journey_type: t })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.journey_type === t
                      ? `${typeColors[t]} text-white`
                      : "bg-bg-elevated text-dim hover:text-cream"
                  }`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>

            {/* Description */}
            <div className="flex items-start gap-3">
              <AlignLeft className="w-4 h-4 mt-2.5 text-accent flex-shrink-0" />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Adicionar descricao"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Estimated days */}
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-accent flex-shrink-0" />
              <input
                type="number"
                min={1}
                value={form.estimated_days}
                onChange={(e) =>
                  setForm({ ...form, estimated_days: e.target.value })
                }
                placeholder="Dias estimados"
                className={inputCls}
              />
            </div>

            {/* Color picker */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-dim">
                Cor
              </span>
              <div className="flex gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full transition-all ${
                      form.color === c
                        ? "ring-2 ring-offset-2 ring-offset-bg-card ring-accent scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Self-enroll toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-elevated border border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-accent" />
                <div>
                  <p className="text-sm text-cream font-medium">Inscrição livre</p>
                  <p className="text-[10px] text-dim">Membros criam seus próprios grupos</p>
                </div>
              </div>
              <button
                onClick={() => setForm({ ...form, self_enroll: !form.self_enroll })}
                className={`w-10 h-5.5 rounded-full transition-all relative ${form.self_enroll ? "bg-accent" : "bg-bg-elevated ring-1 ring-[var(--border-color)]"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${form.self_enroll ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Footer — sticky */}
          <div className="sticky bottom-0 bg-bg-card border-t border-[var(--border-color)] px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-dim hover:text-cream transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.name || saving}
              className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Criar
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modal-scale {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Journey Card ──────────────────────────────────────────────────────────

function JourneyCard({
  journey,
  isAdmin,
  onDelete,
  onClick,
}: {
  journey: JourneyRow;
  isAdmin: boolean;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const jType = journey.journeyType || "custom";
  const color = journey.color || "#C4A882";
  const isDraft = journey.status === "draft";
  const isArchived = journey.status === "archived";
  const isLocked = isDraft || isArchived;

  return (
    <div
      className={`group relative bg-bg-surface/80 border border-[var(--border-color)] rounded-2xl shadow-card backdrop-blur-sm transition-all duration-200 cursor-pointer overflow-hidden flex flex-col ${isLocked ? "opacity-75" : "hover:border-accent/30 hover:shadow-lg"}`}
      onClick={isLocked && !isAdmin ? undefined : onClick}
    >
      {/* Cover image or colored header */}
      {journey.coverImage ? (
        <div className="h-32 w-full relative">
          <img src={journey.coverImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-surface/90 to-transparent" />
        </div>
      ) : (
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}88)`,
          }}
        />
      )}

      {/* Lock overlay for draft/archived */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-surface/40 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-bg-card/90 border border-[var(--border-color)] shadow-elevated">
            <Lock className="w-5 h-5 text-dim" />
            <span className="text-xs font-medium text-dim">
              {isDraft ? "Em breve" : "Arquivada"}
            </span>
            {isAdmin && (
              <span className="text-[10px] text-accent">Clique para editar</span>
            )}
          </div>
        </div>
      )}

      {/* Delete button — only on hover, only for admins */}
      {isAdmin && (
        <button
          onClick={(e) => onDelete(journey.id, e)}
          className="absolute top-4 right-3 p-1.5 rounded-lg text-dim/0 group-hover:text-dim hover:!text-red-400 hover:bg-bg-elevated transition-all z-20"
          title="Excluir jornada"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Card body */}
      <div className="px-5 pt-4 pb-3 flex flex-col flex-1 gap-3">
        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={typeBadgeVariant[jType] || "default"}>
            {typeLabels[jType] || jType}
          </Badge>
          {isDraft && <Badge variant="default">Rascunho</Badge>}
          {isArchived && <Badge variant="default">Arquivada</Badge>}
          {journey.selfEnroll === 1 && (
            <div className="flex items-center gap-1 text-[10px] text-accent font-medium">
              <Users className="w-3 h-3" /> Inscrição livre
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-cream leading-snug pr-6">
          {journey.name}
        </h3>

        {/* Description */}
        {journey.description ? (
          <p className="text-sm text-dim leading-relaxed line-clamp-3 min-h-[3.75rem]">
            {journey.description}
          </p>
        ) : (
          <p className="text-sm text-dim/40 italic leading-relaxed line-clamp-3 min-h-[3.75rem]">
            Sem descricao
          </p>
        )}

        {/* Active instances indicator */}
        {journey.activeInstanceCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-400">
              {journey.activeInstanceCount} turma
              {journey.activeInstanceCount !== 1 ? "s" : ""} ativa
              {journey.activeInstanceCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Bottom meta row */}
        <div className="flex items-center gap-4 mt-auto pt-3 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 text-xs text-dim">
            <Layers className="w-3.5 h-3.5" />
            <span>
              {journey.stageCount} etapa
              {journey.stageCount !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-dim">
            <ListChecks className="w-3.5 h-3.5" />
            <span>
              {journey.taskCount} tarefa
              {journey.taskCount !== 1 ? "s" : ""}
            </span>
          </div>
          {journey.estimatedDays != null && journey.estimatedDays > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-dim ml-auto">
              <Clock className="w-3.5 h-3.5" />
              <span>{journey.estimatedDays}d</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6">
      <div className="w-20 h-20 rounded-2xl bg-bg-elevated border border-[var(--border-color)] flex items-center justify-center mb-6">
        <Compass className="w-9 h-9 text-dim/50" />
      </div>
      <h3 className="text-xl font-semibold text-cream mb-2">
        Nenhuma jornada criada
      </h3>
      <p className="text-sm text-dim text-center max-w-sm mb-8">
        Crie sua primeira jornada de aprendizagem para os membros da liga
      </p>
      <Button onClick={onCreateClick} size="md">
        <Plus className="w-4 h-4" />
        Criar Jornada
      </Button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function JourneysPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;

  const [journeys, setJourneys] = useState<JourneyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [permLoading, setPermLoading] = useState(true);

  // Check permissions
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user) {
          const perms = user.permissions || [];
          setIsAdmin(
            perms.includes("admin") ||
              perms.includes("manage_eval") ||
              perms.includes("manage_users")
          );
        }
      })
      .catch(() => {})
      .finally(() => setPermLoading(false));
  }, []);

  const fetchJourneys = useCallback(async () => {
    try {
      const res = await fetch("/api/journeys");
      if (res.ok) {
        const data = await res.json();
        setJourneys(data);
      }
    } catch (err) {
      console.error("Failed to fetch journeys:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = async (journeyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Excluir esta jornada e todas as suas etapas/tarefas?"))
      return;
    try {
      const res = await fetch(`/api/journeys/${journeyId}`, {
        method: "DELETE",
      });
      if (res.ok)
        setJourneys((prev) => prev.filter((j) => j.id !== journeyId));
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  // Non-admins don't see draft journeys unless they have an active instance
  const visibleJourneys = isAdmin ? journeys : journeys.filter(j => j.status !== "draft" || (j.activeInstanceCount || 0) > 0);
  const totalStages = visibleJourneys.reduce((a, j) => a + (j.stageCount || 0), 0);
  const totalTasks = visibleJourneys.reduce((a, j) => a + (j.taskCount || 0), 0);
  const totalActive = visibleJourneys.reduce((a, j) => a + (j.activeInstanceCount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-serif">Jornadas</h2>
          <p className="text-dim text-sm mt-1 max-w-md">
            Crie e gerencie jornadas de aprendizagem para os membros da liga
          </p>
        </div>
        {!permLoading && isAdmin && (
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" />
            Nova Jornada
          </Button>
        )}
      </div>

      {/* Featured active journey — hero card */}
      {!loading && visibleJourneys.length > 0 && (() => {
        const featured = visibleJourneys.find(j => (j.activeInstanceCount || 0) > 0 && j.status !== "draft");
        if (!featured) return null;
        const color = featured.color || "#C4A882";
        return (
          <div
            className="relative overflow-hidden rounded-2xl cursor-pointer group"
            onClick={() => router.push(`/admin/${evalId}/journeys/${featured.id}`)}
            style={{ background: `linear-gradient(135deg, ${color}18 0%, ${color}08 50%, transparent 100%)` }}
          >
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-[0.06]" style={{ backgroundColor: color }} />
            <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full opacity-[0.04]" style={{ backgroundColor: color }} />

            <div className="relative px-7 py-6 flex items-start gap-5">
              {/* Left — large icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}>
                <Compass className="w-8 h-8" style={{ color }} />
              </div>

              {/* Center — info */}
              <div className="flex-1 min-w-0 space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} /><span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} /></span>
                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color }}>Em andamento</span>
                    <Badge variant={typeBadgeVariant[featured.journeyType || "custom"] || "default"}>
                      {typeLabels[featured.journeyType || "custom"] || featured.journeyType}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-cream group-hover:text-accent transition-colors">{featured.name}</h3>
                  {featured.description && <p className="text-sm text-dim mt-1 line-clamp-1">{featured.description}</p>}
                </div>

                {/* Mini stage pipeline */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: featured.stageCount || 1 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border" style={{ borderColor: `${color}40`, color: color, backgroundColor: `${color}10` }}>
                        {i + 1}
                      </div>
                      {i < (featured.stageCount || 1) - 1 && <div className="w-4 h-px" style={{ backgroundColor: `${color}30` }} />}
                    </div>
                  ))}
                  <span className="text-[10px] text-dim ml-2">{featured.taskCount} tarefas · {featured.activeInstanceCount} turma{featured.activeInstanceCount !== 1 ? "s" : ""}{featured.estimatedDays ? ` · ${featured.estimatedDays}d` : ""}</span>
                </div>
              </div>

              {/* Right — arrow */}
              <div className="text-dim/30 group-hover:text-accent transition-colors flex-shrink-0 mt-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </div>
            </div>
          </div>
        );
      })()}

      <CreateJourneyModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchJourneys}
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span className="ml-2 text-sm text-dim">
            Carregando jornadas...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!loading && journeys.length === 0 && (
        <EmptyState onCreateClick={() => setShowModal(true)} />
      )}

      {/* Journey Cards */}
      {!loading && visibleJourneys.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleJourneys.map((j) => (
            <JourneyCard
              key={j.id}
              journey={j}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onClick={() =>
                router.push(`/admin/${evalId}/journeys/${j.id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
