"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Submission {
  id: string;
  candidateId: string;
  teamId: string;
  fileName: string;
  aiUsage: string;
  submittedAt: string;
}

interface Team {
  id: string;
  number: number;
}

interface EvalResult {
  submissionId: string;
  finalScore?: number;
  profile?: string;
  status: string;
  error?: string;
}

export default function EvaluatePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ teams: Team[]; candidates: Array<Record<string, string>>; caseFileUrl?: string } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [caseFile, setCaseFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/evaluations/${id}/data`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // Collect all submissions from candidates' context
        fetchSubmissions();
      })
      .catch(() => {});
  }, [id]);

  async function fetchSubmissions() {
    const res = await fetch(`/api/evaluations/${id}/submissions`);
    if (res.ok) {
      const subs = await res.json();
      setSubmissions(subs);
    }
  }

  async function handleUploadCase() {
    if (!caseFile) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", caseFile);
    try {
      await fetch(`/api/evaluations/${id}/case`, { method: "POST", body: formData });
      setData((prev) => prev ? { ...prev, caseFileUrl: `/uploads/${caseFile.name}` } : prev);
    } finally {
      setUploading(false);
    }
  }

  async function handleEvaluateAll() {
    if (submissions.length === 0) return;
    setIsEvaluating(true);
    setResults([]);
    setProgress(0);

    const subIds = submissions.map((s) => s.id);

    try {
      const res = await fetch(`/api/evaluations/${id}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionIds: subIds }),
      });
      const data = await res.json();
      setResults(data.results || []);
      setProgress(100);
    } catch {
      setProgress(0);
    } finally {
      setIsEvaluating(false);
    }
  }

  const teamMap = new Map((data?.teams || []).map((t) => [t.id, t]));
  const evaluated = results.filter((r) => r.status === "success").length;
  const failed = results.filter((r) => r.status === "error").length;

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      <div>
        <h2 className="text-2xl font-serif">Avaliar com IA</h2>
        <p className="text-dim text-sm mt-1">
          Processe submissões com Claude e gere scores automáticos
        </p>
      </div>

      {/* Case Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Material do Case</CardTitle>
          <CardDescription>Upload do PDF que será disponibilizado aos candidatos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.caseFileUrl ? (
            <div className="flex items-center gap-3 p-3 bg-bg-surface rounded-lg border border-white/5">
              
              <span className="text-sm text-cream">Case uploaded</span>
              <Badge variant="success">Disponível</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center h-20 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors">
                <span className="text-sm text-dim">
                  {caseFile ? caseFile.name : "📎 Clique para upload do case (PDF)"}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setCaseFile(e.target.files?.[0] || null)}
                />
              </label>
              {caseFile && (
                <Button onClick={handleUploadCase} isLoading={uploading} size="md">
                  Upload
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Submissões Recebidas</CardTitle>
          <CardDescription>
            {submissions.length} submissão(ões) prontas para avaliação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-dim">Nenhuma submissão recebida ainda</p>
              <p className="text-dim/60 text-xs mt-1">Candidatos precisam enviar seus cases primeiro</p>
            </div>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => {
                const team = teamMap.get(sub.teamId);
                const result = results.find((r) => r.submissionId === sub.id);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-cream">
                        {team ? `Equipe ${team.number}` : sub.candidateId}
                      </span>
                      <span className="text-xs text-dim">{sub.fileName || "case"}</span>
                      {sub.aiUsage && sub.aiUsage !== "none" && (
                        <Badge variant="accent">IA: {sub.aiUsage}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-dim">
                        {new Date(sub.submittedAt).toLocaleDateString("pt-BR")}
                      </span>
                      {result && (
                        result.status === "success" ? (
                          <Badge variant="success">
                            {result.finalScore?.toFixed(1)} · {result.profile}
                          </Badge>
                        ) : (
                          <Badge variant="danger">Erro</Badge>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluate Action */}
      {submissions.length > 0 && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-cream">Rodar Avaliação por IA</h3>
                <p className="text-xs text-dim mt-1">
                  Claude avaliará cada submissão com base nos critérios e rubricas configurados.
                  Isso pode levar alguns minutos.
                </p>
              </div>
              <Button
                onClick={handleEvaluateAll}
                isLoading={isEvaluating}
                disabled={isEvaluating}
                size="lg"
              >
                {isEvaluating ? "Avaliando..." : " Avaliar Todas"}
              </Button>
            </div>

            {/* Progress */}
            {(isEvaluating || results.length > 0) && (
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-1000"
                    style={{ width: `${isEvaluating ? 50 : progress}%` }}
                  />
                </div>
                {results.length > 0 && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-sage">{evaluated} avaliadas</span>
                    {failed > 0 && <span className="text-danger">{failed} com erro</span>}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
