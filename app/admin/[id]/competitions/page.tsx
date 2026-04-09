"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Users,
  FileText,
  CalendarDays,
  Plus,
  X,
  Trash2,
  Pencil,
  Check,
  Loader2,
  Building2,
  Medal,
  ChevronDown,
} from "lucide-react";

type CompetitionType = "case" | "research" | "hackathon";

interface CompetitionRow {
  id: string;
  name: string;
  organizer: string | null;
  description: string | null;
  competitionType: string | null;
  startDate: string | null;
  endDate: string | null;
  result: string | null;
  placement: string | null;
  teamMembers: string | null;
  documents: string | null;
  createdAt: string;
}

const typeLabels: Record<string, string> = {
  case: "Case",
  research: "Research Challenge",
  hackathon: "Hackathon",
};

const typeColors: Record<string, string> = {
  case: "bg-blue-500",
  research: "bg-purple-500",
  hackathon: "bg-amber-500",
};

const typeBadgeVariant: Record<string, "accent" | "info" | "warning"> = {
  case: "accent",
  research: "info",
  hackathon: "warning",
};

function placementVariant(
  placement: string | null
): "success" | "warning" | "info" | "default" {
  if (!placement) return "default";
  if (placement.includes("1")) return "success";
  if (placement.includes("2") || placement.includes("3")) return "warning";
  return "info";
}

function parseJsonArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface FormState {
  name: string;
  organizer: string;
  description: string;
  competition_type: CompetitionType;
  start_date: string;
  end_date: string;
  result: string;
  placement: string;
  team_members: string;
  documents: string;
}

const emptyForm: FormState = {
  name: "",
  organizer: "",
  description: "",
  competition_type: "case",
  start_date: "",
  end_date: "",
  result: "",
  placement: "",
  team_members: "",
  documents: "",
};

const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

// ─── Modal ──────────────────────────────────────────────────────────────────

function CreateCompetitionModal({
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
  const [showMore, setShowMore] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setShowMore(false);
      setShowEndDate(false);
    }
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
      const teamArr = form.team_members
        ? form.team_members
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      const docsArr = form.documents
        ? form.documents
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          team_members: JSON.stringify(teamArr),
          documents: JSON.stringify(docsArr),
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
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
        style={{ animation: "modal-fade 0.2s ease-out" }}
      />

      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{
          animation:
            "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-bg-card rounded-t-2xl border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${typeColors[form.competition_type] || "bg-blue-500"}`}
              />
              <h2 className="text-lg font-semibold text-cream truncate max-w-[300px]">
                {form.name || "Nova Competicao"}
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
              placeholder="Nome da competicao"
              className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40"
            />

            {/* Type pills */}
            <div className="flex gap-2 flex-wrap">
              {(["case", "research", "hackathon"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() =>
                    setForm({ ...form, competition_type: t })
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    form.competition_type === t
                      ? `${typeColors[t]} text-white`
                      : "bg-bg-elevated text-dim hover:text-cream"
                  }`}
                >
                  {typeLabels[t]}
                </button>
              ))}
            </div>

            {/* Organizer */}
            <div className="flex items-center gap-3">
              <Building2 className="w-4 h-4 text-accent flex-shrink-0" />
              <input
                value={form.organizer}
                onChange={(e) =>
                  setForm({ ...form, organizer: e.target.value })
                }
                placeholder="Organizador (CFA Institute, FGV...)"
                className={inputCls}
              />
            </div>

            {/* Start date */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                    {showEndDate ? "Inicio" : "Data de inicio"}
                  </label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              {/* End date — toggleable */}
              {showEndDate ? (
                <div className="flex items-center gap-3 ml-7">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                      Fim
                    </label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) =>
                        setForm({ ...form, end_date: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowEndDate(false);
                      setForm((f) => ({ ...f, end_date: "" }));
                    }}
                    className="p-1.5 text-dim hover:text-red-400 transition-colors mt-4"
                    title="Remover data de fim"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowEndDate(true)}
                  className="ml-7 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  + Adicionar data de fim
                </button>
              )}
            </div>

            {/* Description */}
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-2.5 flex-shrink-0 text-accent">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h10"
                  />
                </svg>
              </div>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Adicionar descricao ou notas"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* More options toggle */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex items-center gap-2 text-xs text-dim hover:text-cream transition-colors"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showMore ? "rotate-180" : ""}`}
              />
              {showMore ? "Menos opcoes" : "Mais opcoes"}
            </button>

            {showMore && (
              <div className="space-y-3 pt-1 border-t border-[var(--border-color)]">
                {/* Result */}
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-accent flex-shrink-0" />
                  <input
                    value={form.result}
                    onChange={(e) =>
                      setForm({ ...form, result: e.target.value })
                    }
                    placeholder="Resultado (Em andamento, Semifinalista...)"
                    className={inputCls}
                  />
                </div>

                {/* Placement */}
                <div className="flex items-center gap-3">
                  <Medal className="w-4 h-4 text-accent flex-shrink-0" />
                  <input
                    value={form.placement}
                    onChange={(e) =>
                      setForm({ ...form, placement: e.target.value })
                    }
                    placeholder="Colocacao (1o lugar, Top 8...)"
                    className={inputCls}
                  />
                </div>

                {/* Team members */}
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-accent flex-shrink-0" />
                  <input
                    value={form.team_members}
                    onChange={(e) =>
                      setForm({ ...form, team_members: e.target.value })
                    }
                    placeholder="Membros da equipe (separados por virgula)"
                    className={inputCls}
                  />
                </div>

                {/* Documents */}
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-accent flex-shrink-0" />
                  <input
                    value={form.documents}
                    onChange={(e) =>
                      setForm({ ...form, documents: e.target.value })
                    }
                    placeholder="Links de documentos (separados por virgula)"
                    className={inputCls}
                  />
                </div>
              </div>
            )}
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
              Registrar
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

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<CompetitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ result: "", placement: "" });

  const fetchCompetitions = useCallback(async () => {
    try {
      const res = await fetch("/api/competitions");
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data);
      }
    } catch (err) {
      console.error("Failed to fetch competitions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  const handleDelete = async (compId: string) => {
    if (!confirm("Remover esta competicao?")) return;
    try {
      const res = await fetch(`/api/competitions/${compId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCompetitions((prev) => prev.filter((c) => c.id !== compId));
      }
    } catch (err) {
      console.error("Failed to delete competition:", err);
    }
  };

  const startEdit = (comp: CompetitionRow) => {
    setEditingId(comp.id);
    setEditForm({
      result: comp.result || "",
      placement: comp.placement || "",
    });
  };

  const handleUpdate = async (compId: string) => {
    try {
      const res = await fetch(`/api/competitions/${compId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchCompetitions();
      }
    } catch (err) {
      console.error("Failed to update competition:", err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Competicoes</h2>
          <p className="text-dim text-sm mt-1">
            {loading
              ? "Carregando..."
              : `${competitions.length} competicoes registradas`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Registrar Competicao
        </Button>
      </div>

      <CreateCompetitionModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchCompetitions}
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
          <span className="ml-2 text-sm text-dim">
            Carregando competicoes...
          </span>
        </div>
      )}

      {/* Competition Cards */}
      {!loading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {competitions.length === 0 && (
            <Card className="md:col-span-2 lg:col-span-3">
              <CardContent>
                <p className="text-dim text-sm text-center py-4">
                  Nenhuma competicao registrada.
                </p>
              </CardContent>
            </Card>
          )}

          {competitions.map((comp) => {
            const teamArr = parseJsonArray(comp.teamMembers);
            const docsArr = parseJsonArray(comp.documents);
            const compType = comp.competitionType || "case";
            const isEditing = editingId === comp.id;

            return (
              <Card
                key={comp.id}
                className="hover:border-[var(--border-color)] transition-colors flex flex-col"
              >
                <CardContent className="flex flex-col flex-1 gap-4">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-cream leading-tight">
                        {comp.name}
                      </h3>
                      <Badge variant={typeBadgeVariant[compType] || "accent"}>
                        {typeLabels[compType] || compType}
                      </Badge>
                    </div>
                    {comp.organizer && (
                      <p className="text-xs text-dim">{comp.organizer}</p>
                    )}
                  </div>

                  {/* Dates */}
                  {(comp.startDate || comp.endDate) && (
                    <div className="flex items-center gap-1.5 text-xs text-dim">
                      <CalendarDays className="w-3 h-3" />
                      <span>
                        {comp.startDate
                          ? new Date(comp.startDate).toLocaleDateString("pt-BR")
                          : "\u2014"}{" "}
                        -{" "}
                        {comp.endDate
                          ? new Date(comp.endDate).toLocaleDateString("pt-BR")
                          : "\u2014"}
                      </span>
                    </div>
                  )}

                  {/* Result — editable inline */}
                  <div className="flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          className="h-7 flex-1 px-2 bg-bg-elevated border border-[var(--border-color)] rounded text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent/30"
                          value={editForm.result}
                          onChange={(e) =>
                            setEditForm({ ...editForm, result: e.target.value })
                          }
                          placeholder="Resultado"
                        />
                        <input
                          className="h-7 w-24 px-2 bg-bg-elevated border border-[var(--border-color)] rounded text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent/30"
                          value={editForm.placement}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              placement: e.target.value,
                            })
                          }
                          placeholder="Colocacao"
                        />
                        <button
                          onClick={() => handleUpdate(comp.id)}
                          className="p-1 rounded hover:bg-accent/10 text-accent transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 rounded hover:bg-bg-elevated text-dim transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => startEdit(comp)}
                      >
                        {comp.placement ? (
                          <Badge variant={placementVariant(comp.placement)}>
                            {comp.placement}
                          </Badge>
                        ) : (
                          <span className="text-xs text-dim">
                            {comp.result || "Sem resultado"}
                          </span>
                        )}
                        <Pencil className="w-3 h-3 text-dim opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>

                  {/* Team */}
                  {teamArr.length > 0 && (
                    <div className="space-y-1.5 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs text-dim">
                        <Users className="w-3 h-3" />
                        <span>Equipe ({teamArr.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {teamArr.map((member) => (
                          <span
                            key={member}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-bg-elevated text-cream/70 border border-[var(--border-color)]"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Docs + Delete */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-1.5 text-xs text-dim">
                      <FileText className="w-3 h-3" />
                      <span>
                        {docsArr.length} documento
                        {docsArr.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(comp.id)}
                      className="p-1.5 rounded hover:bg-danger/10 text-dim hover:text-danger transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
