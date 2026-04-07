"use client";
import { PSHeader } from "@/components/ps-header";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Team { id: string; number: number; }
interface Candidate { id: string; name: string; teamId: string | null; status: string; }

export default function EvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasCase, setHasCase] = useState(false);
  const [caseFile, setCaseFile] = useState<File | null>(null);

  useEffect(() => {
    fetch(`/api/evaluations/${id}/data`).then((r) => r.json()).then((d) => {
      setTeams(d.teams || []);
      setCandidates(d.candidates || []);
      setHasCase(!!d.caseFileUrl);
    }).catch(() => {});
  }, [id]);

  async function handleUploadCase() {
    if (!caseFile) return;
    const fd = new FormData();
    fd.append("file", caseFile);
    await fetch(`/api/evaluations/${id}/case`, { method: "POST", body: fd });
    setHasCase(true);
    setCaseFile(null);
  }

  const membersByTeam = (teamId: string) => candidates.filter((c) => c.teamId === teamId);
  const submitted = candidates.filter((c) => c.status !== "pending").length;

  return (
    <div className="space-y-6 animate-fade-in-up max-w-5xl">
      <div>
        <PSHeader evaluationId={id} />

      <h2 className="text-2xl font-serif mt-6">Avaliacao</h2>
        <p className="text-dim text-sm mt-1">{teams.length} equipes · {submitted}/{candidates.length} submetidos</p>
      </div>

      {/* Material do Case */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            
            <div>
              <span className="text-sm font-medium text-cream">Material do Case</span>
              <p className="text-[10px] text-dim">{hasCase ? "PDF disponível" : "Faça upload do PDF"}</p>
            </div>
          </div>
          {hasCase ? (
            <Badge variant="success">Uploaded</Badge>
          ) : (
            <div className="flex items-center gap-2">
              <label className="px-3 py-1.5 text-xs border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-accent/30 transition-colors text-dim">
                {caseFile ? caseFile.name : "Escolher PDF"}
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => setCaseFile(e.target.files?.[0] || null)} />
              </label>
              {caseFile && <Button size="sm" onClick={handleUploadCase}>Upload</Button>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim mb-4">Equipes</h3>
        <p className="text-sm text-dim mb-4">Clique numa equipe para ver detalhes, avaliação IA, avaliação da banca, pitch e feedback.</p>
        <div className="grid gap-3">
          {teams.map((team) => {
            const members = membersByTeam(team.id);
            const hasSubmission = members.some((m) => m.status !== "pending");
            const isEvaluated = members.some((m) => m.status === "evaluated" || m.status === "completed");
            return (
              <div key={team.id} className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-5 transition-all duration-200 hover:ring-accent/20">
                <div className="flex items-center gap-4">
                  {/* Team number */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold text-lg font-mono">
                    {team.number}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-cream">Equipe {team.number}</h3>
                    <p className="text-[11px] text-dim mt-0.5">{members.map((m) => m.name).join(", ")}</p>
                  </div>

                  {/* Status + Actions */}
                  <div className="flex items-center gap-2">
                    <Badge variant={isEvaluated ? "success" : hasSubmission ? "accent" : "default"}>
                      {isEvaluated ? "Avaliado" : hasSubmission ? "Submetido" : "Pendente"}
                    </Badge>

                    {!isEvaluated && (
                      <Link href={`/admin/${id}/evaluation/${team.id}`}>
                        <Button size="sm" variant={hasSubmission ? "primary" : "secondary"}>
                          {hasSubmission ? "Iniciar Avaliação" : "Ver Detalhes"}
                        </Button>
                      </Link>
                    )}

                    {isEvaluated && (
                      <Link href={`/admin/${id}/evaluation/${team.id}`}>
                        <Button size="sm" variant="secondary">Ver Avaliação</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
