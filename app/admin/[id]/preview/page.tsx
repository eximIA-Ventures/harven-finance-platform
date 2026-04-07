"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, User, ClipboardCheck } from "lucide-react";

type ViewMode = "candidate" | "evaluator";

interface Candidate {
  id: string;
  name: string;
  email: string;
  magicToken: string;
  status: string;
  teamId: string | null;
}

interface Evaluator {
  id: string;
  name: string;
  email: string;
  role: string | null;
  accessToken: string;
}

interface Team {
  id: string;
  number: number;
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ViewMode>("candidate");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/evaluations/${id}/data`)
      .then((r) => r.json())
      .then((d) => {
        setCandidates(d.candidates || []);
        setEvaluators(d.evaluators || []);
        setTeams(d.teams || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      <div>
        <h2 className="text-2xl font-serif">Preview</h2>
        <p className="text-dim text-sm mt-1">
          Visualize a plataforma como candidato ou avaliador
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("candidate")}
          className={`flex-1 p-4 rounded-2xl border text-center transition-colors ${
            mode === "candidate"
              ? "border-accent bg-accent/10 text-accent"
              : "border-[var(--border-color)] hover:border-accent/20 text-dim"
          }`}
        >
          <User size={20} className="mx-auto mb-1" />
          <span className="text-sm font-medium block">Ver como Candidato</span>
          <p className="text-xs text-dim mt-1">{candidates.length} candidatos</p>
        </button>
        <button
          onClick={() => setMode("evaluator")}
          className={`flex-1 p-4 rounded-2xl border text-center transition-colors ${
            mode === "evaluator"
              ? "border-sage bg-sage/10 text-sage"
              : "border-[var(--border-color)] hover:border-accent/20 text-dim"
          }`}
        >
          <ClipboardCheck size={20} className="mx-auto mb-1" />
          <span className="text-sm font-medium block">Ver como Avaliador</span>
          <p className="text-xs text-dim mt-1">{evaluators.length} avaliadores</p>
        </button>
      </div>

      {/* Candidate Links */}
      {mode === "candidate" && (
        <Card>
          <CardHeader>
            <CardTitle>Links dos Candidatos</CardTitle>
            <CardDescription>
              Clique para abrir o portal exatamente como o candidato ve
            </CardDescription>
          </CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <p className="text-dim text-sm py-4 text-center">Nenhum candidato importado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-2 px-3 text-xs font-medium text-dim">Nome</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-dim">Email</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-dim">Equipe</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-dim">Status</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-dim">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => {
                      const team = c.teamId ? teamMap.get(c.teamId) : null;
                      return (
                        <tr key={c.id} className="border-b border-[var(--border-color)] hover:bg-bg-surface">
                          <td className="py-2.5 px-3 font-medium text-cream">{c.name}</td>
                          <td className="py-2.5 px-3 text-dim">{c.email}</td>
                          <td className="py-2.5 px-3">
                            {team ? <Badge variant="default">Equipe {team.number}</Badge> : <span className="text-dim">--</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={c.status === "submitted" ? "success" : c.status === "evaluated" ? "accent" : "default"}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <a
                              href={`/c/${c.magicToken}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                            >
                              Abrir <ExternalLink size={12} />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Evaluator Links */}
      {mode === "evaluator" && (
        <Card>
          <CardHeader>
            <CardTitle>Links dos Avaliadores</CardTitle>
            <CardDescription>
              Clique para abrir o portal exatamente como o avaliador ve
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evaluators.length === 0 ? (
              <p className="text-dim text-sm py-4 text-center">Nenhum avaliador cadastrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-2 px-3 text-xs font-medium text-dim">Nome</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-dim">Email</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-dim">Funcao</th>
                      <th className="text-right py-2 px-3 text-xs font-medium text-dim">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluators.map((ev) => (
                      <tr key={ev.id} className="border-b border-[var(--border-color)] hover:bg-bg-surface">
                        <td className="py-2.5 px-3 font-medium text-cream">{ev.name}</td>
                        <td className="py-2.5 px-3 text-dim">{ev.email}</td>
                        <td className="py-2.5 px-3 text-dim">{ev.role || "--"}</td>
                        <td className="py-2.5 px-3 text-right">
                          <a
                            href={`/eval/${ev.accessToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sage hover:text-sage-hover transition-colors"
                          >
                            Abrir <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
