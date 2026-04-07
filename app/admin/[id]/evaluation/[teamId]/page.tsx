"use client";

import { useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { ScoreBar } from "@/components/ui/score-bar";
import { CASE_CRITERIA, getSections, calculateScore } from "@/lib/evaluation-criteria";

type View = "overview" | "evaluate" | "pitch" | "feedback";

interface Candidate { id: string; name: string; email: string; group: string | null; status: string; }

export default function TeamDetailPage() {
  const { id, teamId } = useParams<{ id: string; teamId: string }>();
  const [view, setView] = useState<View>("overview");
  const [team, setTeam] = useState<{ number: number } | null>(null);
  const [members, setMembers] = useState<Candidate[]>([]);
  const [submissionText, setSubmissionText] = useState("");
  const [showCase, setShowCase] = useState(false);
  const [impression, setImpression] = useState("");
  const [bancaFeedback, setBancaFeedback] = useState("");
  const [evalSubmitted, setEvalSubmitted] = useState(false);

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    CASE_CRITERIA.forEach((c) => { init[c.id] = 0; });
    return init;
  });

  const { sectionScores, finalScore } = calculateScore(CASE_CRITERIA, scores);
  const sections = getSections(CASE_CRITERIA);

  useEffect(() => {
    fetch(`/api/evaluations/${id}/team/${teamId}`).then((r) => r.json()).then((d) => {
      setTeam(d.team);
      setMembers(d.members || []);
      setSubmissionText(d.submissionText || "");
    }).catch(() => {});
  }, [id, teamId]);

  async function handleSubmitEval() {
    await fetch(`/api/evaluations/${id}/team/${teamId}/human-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scores, sectionScores, finalScore, impression }),
    });
    setEvalSubmitted(true);
    setView("overview");
  }

  function getVerdict(score: number) {
    if (score >= 8) return { label: "Destaque", variant: "success" as const };
    if (score >= 7) return { label: "Aprovado", variant: "success" as const };
    if (score >= 5) return { label: "Borderline", variant: "warning" as const };
    return { label: "Reprovado", variant: "danger" as const };
  }

  return (
    <div className="animate-fade-in-up max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/admin/${id}/evaluation`} className="text-[11px] text-dim hover:text-cream transition-colors">← Equipes</Link>
        <div className="flex items-start justify-between mt-3">
          <div>
            <h2 className="text-2xl font-serif text-cream">Equipe {team?.number}</h2>
            <p className="text-dim text-sm mt-0.5">{members.map((m) => m.name).join(", ")}</p>
          </div>

          {/* Action buttons — right side */}
          <div className="flex items-center gap-2">
            {view !== "overview" && (
              <Button size="sm" variant="ghost" onClick={() => setView("overview")}>
                ← Visao Geral
              </Button>
            )}
            {view === "overview" && !evalSubmitted && (
              <Button size="sm" variant="primary" onClick={() => setView("evaluate")}>
                Avaliar
              </Button>
            )}
            {view === "overview" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setView("pitch")}>
                  Pitch
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setView("feedback")}>
                  Feedback
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ VISÃO GERAL ═══════════ */}
      {view === "overview" && (
        <div className="space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4 text-center">
              <p className="text-2xl font-bold font-mono text-cream">{members.length}</p>
              <p className="text-[10px] text-dim uppercase tracking-wider mt-1">Membros</p>
            </div>
            <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4 text-center">
              <p className={`text-2xl font-bold font-mono ${submissionText ? "text-sage" : "text-dim"}`}>
                {submissionText ? "Sim" : "—"}
              </p>
              <p className="text-[10px] text-dim uppercase tracking-wider mt-1">Case</p>
            </div>
            <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4 text-center">
              <p className={`text-2xl font-bold font-mono ${evalSubmitted ? "text-accent" : "text-dim"}`}>
                {evalSubmitted ? finalScore.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-dim uppercase tracking-wider mt-1">Score Banca</p>
            </div>
          </div>

          {/* Membros */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim mb-3">Membros</h3>
            <div className="rounded-xl ring-1 ring-[var(--border-color)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-surface">
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Nome</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Email</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Turma</th>
                    <th className="px-4 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-[var(--border-color)]">
                      <td className="px-4 py-2.5 font-medium text-cream">{m.name}</td>
                      <td className="px-4 py-2.5 text-dim text-xs">{m.email}</td>
                      <td className="px-4 py-2.5 text-center text-dim text-xs">{m.group || "—"}</td>
                      <td className="px-4 py-2.5 text-center"><Badge variant="default">Pendente</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Case */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Submissão do Case</h3>
              {submissionText && (
                <button onClick={() => setShowCase(!showCase)} className="text-[10px] text-accent hover:text-accent-hover transition-colors">
                  {showCase ? "Fechar ▲" : "Ler case ▼"}
                </button>
              )}
            </div>
            {submissionText ? (
              <>
                <div className="rounded-xl ring-1 ring-sage/20 bg-sage/[0.03] p-4 flex items-center gap-3">
                  
                  <span className="text-sm text-cream">Case recebido</span>
                  <Badge variant="success">Submetido</Badge>
                </div>
                {showCase && (
                  <div className="mt-3 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card max-h-[400px] overflow-y-auto p-6 text-sm text-cream-dim whitespace-pre-wrap leading-relaxed">
                    {submissionText}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4 text-center">
                <p className="text-dim text-sm">Aguardando submissão da equipe</p>
              </div>
            )}
          </div>

          {/* Avaliação IA */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Avaliação por IA</h3>
              <Button size="sm" variant="secondary" disabled={!submissionText}> Rodar IA</Button>
            </div>
            <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-6 text-center">
              <p className="text-dim text-sm">Execute a avaliação por IA para ver scores, justificativas e feedback automático.</p>
            </div>
          </div>

          {/* Avaliação Banca — resumo */}
          {evalSubmitted && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim mb-3">Avaliação da Banca</h3>
              <div className="rounded-xl ring-1 ring-accent/20 bg-accent/[0.03] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-cream">Score Final da Banca</span>
                  <span className={`text-2xl font-bold font-mono ${finalScore >= 7 ? "text-sage" : finalScore >= 5 ? "text-warning" : "text-danger"}`}>{finalScore.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  {sections.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <span className="text-cream">{s.name} <span className="text-dim">({(s.weight * 100).toFixed(0)}%)</span></span>
                      <div className="w-32"><ScoreBar score={sectionScores[s.name] ?? 0} size="sm" /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════ AVALIAR (Banca) ═══════════ */}
      {view === "evaluate" && (
        <div className="space-y-4">
          {/* Scale reference */}
          <div className="flex items-center gap-4 text-[9px] text-dim">
            <span>Escala:</span>
            <span className="text-danger">0-3 Insuficiente</span>
            <span className="text-warning">4-5 Basico</span>
            <span className="text-accent">6-7 Bom</span>
            <span className="text-sage">8-10 Excelente</span>
          </div>

          {/* Table */}
          <div className="rounded-xl ring-1 ring-[var(--border-color)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-surface">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim w-[40%]">Criterio</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim w-[10%]">Peso</th>
                  <th className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim w-[30%]">Nota</th>
                  <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-dim w-[20%]">Ponderado</th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section) => (
                  <Fragment key={section.name}>
                    <tr className="bg-accent/[0.06]">
                      <td className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-accent">{section.name}</td>
                      <td className="px-3 py-2.5 text-center text-[10px] font-mono text-accent font-bold">{(section.weight * 100).toFixed(0)}%</td>
                      <td className="px-3 py-2.5"></td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`text-base font-bold font-mono ${(sectionScores[section.name] ?? 0) >= 8 ? "text-sage" : (sectionScores[section.name] ?? 0) >= 6 ? "text-accent" : (sectionScores[section.name] ?? 0) >= 4 ? "text-warning" : "text-danger"}`}>
                          {(sectionScores[section.name] ?? 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                    {section.criteria.map((criterion) => (
                      <tr key={criterion.id} className="border-t border-[var(--border-color)] hover:bg-bg-surface transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-cream">{criterion.name}</p>
                          <p className="text-[10px] text-dim mt-0.5 leading-relaxed">{criterion.description}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-[10px] text-dim font-mono">{(criterion.weight * 100).toFixed(0)}%</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="text" inputMode="decimal"
                              defaultValue=""
                              placeholder="0"
                              onChange={(e) => {
                                const raw = e.target.value.replace(",", ".");
                                if (raw === "" || raw === "." || raw.endsWith(".")) return;
                                const v = Math.min(10, Math.max(0, parseFloat(raw) || 0));
                                setScores({ ...scores, [criterion.id]: v });
                              }}
                              onBlur={(e) => {
                                const raw = e.target.value.replace(",", ".");
                                const v = Math.min(10, Math.max(0, Math.round(parseFloat(raw) * 10) / 10 || 0));
                                setScores({ ...scores, [criterion.id]: v });
                                e.target.value = v ? v.toString().replace(".", ",") : "";
                              }}
                              onFocus={(e) => {
                                if (scores[criterion.id]) e.target.value = scores[criterion.id].toString().replace(".", ",");
                              }}
                              className={`w-20 h-10 text-center font-mono font-bold text-lg rounded-xl border-2 transition-all ${
                                !scores[criterion.id] ? "bg-bg-elevated border-[var(--border-color)] text-dim placeholder:text-dim/30" :
                                scores[criterion.id] >= 8 ? "bg-sage/10 border-sage/40 text-sage" :
                                scores[criterion.id] >= 6 ? "bg-accent/10 border-accent/40 text-accent" :
                                scores[criterion.id] >= 4 ? "bg-warning/10 border-warning/40 text-warning" :
                                "bg-danger/10 border-danger/40 text-danger"
                              } focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent`}
                            />
                            <span className="text-[9px] text-dim">/10</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className={`text-sm font-mono font-medium ${
                            !scores[criterion.id] ? "text-dim/30" :
                            scores[criterion.id] >= 8 ? "text-sage/70" :
                            scores[criterion.id] >= 6 ? "text-accent/70" :
                            "text-dim"
                          }`}>
                            {(scores[criterion.id] * criterion.weight * section.weight).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
                {/* Total row */}
                <tr className="bg-bg-elevated border-t-2 border-[var(--border-color)]">
                  <td className="px-5 py-4 text-sm font-bold text-cream">TOTAL</td>
                  <td className="px-3 py-4 text-center text-[10px] font-mono text-dim">100%</td>
                  <td className="px-3 py-4"></td>
                  <td className="px-3 py-4 text-right">
                    <span className={`text-2xl font-bold font-mono ${finalScore >= 8 ? "text-sage" : finalScore >= 6 ? "text-accent" : finalScore >= 4 ? "text-warning" : "text-danger"}`}>
                      {finalScore.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Impression + Submit */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Textarea placeholder="Impressao geral (opcional)..." value={impression} onChange={(e) => setImpression(e.target.value)} className="min-h-[70px]" />
            </div>
            <Button onClick={handleSubmitEval} size="lg">Enviar ({finalScore.toFixed(2)}/10)</Button>
          </div>
        </div>
      )}

      {/* ═══════════ PITCH ═══════════ */}
      {view === "pitch" && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Enviar Pitch da Equipe</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "", label: "Vídeo", accept: "video/*" },
              { icon: "", label: "Áudio", accept: "audio/*" },
              { icon: "", label: "Transcrição", accept: ".txt,.docx" },
            ].map((opt) => (
              <label key={opt.label} className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-accent/30 transition-colors">
                <span className="text-2xl mb-2">{opt.icon}</span>
                <span className="text-xs text-dim">{opt.label}</span>
                <input type="file" accept={opt.accept} className="hidden" />
              </label>
            ))}
          </div>
          <Textarea placeholder="Ou cole a transcrição do pitch aqui..." className="min-h-[150px] font-mono text-xs" />
          <Button className="w-full" disabled> Avaliar Pitch com IA</Button>
        </div>
      )}

      {/* ═══════════ FEEDBACK ═══════════ */}
      {view === "feedback" && (
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Feedback para a Equipe</h3>
          <p className="text-xs text-dim">Compartilhado entre avaliadores. Visível ao candidato após aprovação.</p>
          <Textarea placeholder="Feedback coletivo — pontos fortes, áreas de melhoria, sugestões..." value={bancaFeedback} onChange={(e) => setBancaFeedback(e.target.value)} className="min-h-[200px]" />
          <div className="flex justify-end">
            <Button variant="secondary" size="sm">Salvar Feedback</Button>
          </div>
        </div>
      )}
    </div>
  );
}
