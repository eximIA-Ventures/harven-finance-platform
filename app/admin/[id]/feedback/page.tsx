"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Send, ChevronDown, Pencil } from "lucide-react";

interface TeamResult {
  teamId: string;
  teamNumber: number;
  members: string[];
  finalScore: number | null;
  classification: string;
  feedback: string | null;
  aiFeedback: string | null;
  feedbackSent: boolean;
}

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [teamResults, setTeamResults] = useState<TeamResult[]>([]);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingTeam, setSavingTeam] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/feedback-data`);
      const data = await res.json();
      setTeamResults(data.teams || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const total = teamResults.length;
  const withFeedback = teamResults.filter((t) => t.feedback || t.aiFeedback).length;
  const sent = teamResults.filter((t) => t.feedbackSent).length;

  const classColors: Record<string, "success" | "accent" | "warning" | "danger"> = {
    Destaque: "success",
    Aprovado: "accent",
    Borderline: "warning",
    Reprovado: "danger",
  };

  function startEdit(team: TeamResult) {
    setEditingTeam(team.teamId);
    setEditText(team.feedback || team.aiFeedback || "");
    if (expandedTeam !== team.teamId) setExpandedTeam(team.teamId);
  }

  async function saveFeedback(teamId: string) {
    setSavingTeam(teamId);
    try {
      const res = await fetch(`/api/evaluations/${id}/feedback-data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, feedback: editText }),
      });
      if (res.ok) {
        setTeamResults((prev) =>
          prev.map((t) => (t.teamId === teamId ? { ...t, feedback: editText } : t))
        );
        setEditingTeam(null);
        showSuccess("Feedback salvo");
      }
    } catch {
      // silent
    } finally {
      setSavingTeam(null);
    }
  }

  async function markSent(teamId: string) {
    setSavingTeam(teamId);
    try {
      const res = await fetch(`/api/evaluations/${id}/feedback-data`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, feedbackSent: true }),
      });
      if (res.ok) {
        setTeamResults((prev) =>
          prev.map((t) => (t.teamId === teamId ? { ...t, feedbackSent: true } : t))
        );
        showSuccess("Marcado como enviado");
      }
    } catch {
      // silent
    } finally {
      setSavingTeam(null);
    }
  }

  async function markAllSent() {
    setSavingTeam("all");
    try {
      for (const team of teamResults) {
        if (!team.feedbackSent && (team.feedback || team.aiFeedback)) {
          await fetch(`/api/evaluations/${id}/feedback-data`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamId: team.teamId, feedbackSent: true }),
          });
        }
      }
      setTeamResults((prev) =>
        prev.map((t) =>
          t.feedback || t.aiFeedback ? { ...t, feedbackSent: true } : t
        )
      );
      showSuccess("Todos marcados como enviados");
    } catch {
      // silent
    } finally {
      setSavingTeam(null);
    }
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Feedbacks</h2>
          <p className="text-dim text-sm mt-1">
            {withFeedback}/{total} feedbacks gerados · {sent} enviados
          </p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <div className="flex items-center gap-2 text-sm text-sage bg-sage/10 border border-sage/20 px-3 py-1.5 rounded-lg">
              <CheckCircle size={14} />
              {success}
            </div>
          )}
          <Button
            variant="secondary"
            disabled={withFeedback === 0 || sent === withFeedback}
            onClick={markAllSent}
            isLoading={savingTeam === "all"}
          >
            <Send size={14} />
            Marcar Todos como Enviados
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="text-center py-5">
            <p className="text-3xl font-bold font-mono text-cream">{total}</p>
            <p className="text-xs text-dim mt-1">Total de equipes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <p className="text-3xl font-bold font-mono text-sage">{withFeedback}</p>
            <p className="text-xs text-dim mt-1">Feedbacks gerados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-5">
            <p className="text-3xl font-bold font-mono text-accent">{sent}</p>
            <p className="text-xs text-dim mt-1">Enviados</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Feedbacks */}
      {teamResults.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-dim text-sm">Nenhuma equipe encontrada. Importe candidatos e sorteie equipes primeiro.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teamResults.map((team) => {
            const isExpanded = expandedTeam === team.teamId;
            const isEditing = editingTeam === team.teamId;
            const feedbackText = team.feedback || team.aiFeedback;

            return (
              <Card key={team.teamId}>
                <CardContent>
                  {/* Header */}
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setExpandedTeam(isExpanded ? null : team.teamId)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-cream">Equipe {team.teamNumber}</span>
                      <span className="text-xs text-dim">{team.members.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {team.finalScore !== null && (
                        <span className="font-mono text-sm text-cream">{team.finalScore.toFixed(2)}</span>
                      )}
                      <Badge variant={classColors[team.classification] || "default"}>
                        {team.classification}
                      </Badge>
                      {team.feedbackSent && <Badge variant="success">Enviado</Badge>}
                      <ChevronDown
                        size={16}
                        className={`text-dim transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)] space-y-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-3 py-3 bg-bg-elevated border border-white/10 rounded-lg text-sm text-cream placeholder:text-dim resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                            placeholder="Escreva o feedback para esta equipe..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => saveFeedback(team.teamId)}
                              isLoading={savingTeam === team.teamId}
                            >
                              Salvar Feedback
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTeam(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : feedbackText ? (
                        <div className="p-4 bg-bg-surface rounded-lg">
                          <p className="text-sm text-cream-dim whitespace-pre-wrap leading-relaxed">
                            {feedbackText}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-dim italic">
                          Feedback ainda nao gerado. Execute a avaliacao por IA primeiro.
                        </p>
                      )}

                      {!isEditing && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => startEdit(team)}
                          >
                            <Pencil size={12} />
                            Editar Feedback
                          </Button>
                          {!team.feedbackSent && feedbackText && (
                            <Button
                              size="sm"
                              onClick={() => markSent(team.teamId)}
                              isLoading={savingTeam === team.teamId}
                            >
                              <Send size={12} />
                              Marcar como Enviado
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
