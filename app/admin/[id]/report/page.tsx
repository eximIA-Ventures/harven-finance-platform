"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/ui/score-bar";
import { Badge } from "@/components/ui/badge";

interface ConsolidatedResult {
  teamId: string;
  aiScore: number | null;
  humanScore: number | null;
  finalScore: number | null;
  divergence: number | null;
  classification: string;
  humanReviewCount: number;
}

interface Team {
  id: string;
  number: number;
}

interface Candidate {
  id: string;
  name: string;
  teamId: string;
}

interface Submission {
  id: string;
  teamId: string;
  aiUsage: string;
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<ConsolidatedResult[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/evaluations/${id}/data`).then((r) => r.json()),
      fetch(`/api/evaluations/${id}/report-data`).then((r) => r.json()).catch(() => ({ results: [] })),
      fetch(`/api/evaluations/${id}/submissions`).then((r) => r.json()).catch(() => []),
    ]).then(([data, report, subs]) => {
      setTeams(data.teams || []);
      setCandidates(data.candidates || []);
      setResults(report.results || []);
      setSubmissions(subs || []);
    });
  }, [id]);

  const scored = results.filter((r) => r.finalScore !== null);
  const scores = scored.map((r) => r.finalScore!);
  const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const max = scores.length > 0 ? Math.max(...scores) : 0;
  const min = scores.length > 0 ? Math.min(...scores) : 0;
  const median = scores.length > 0 ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0;

  const classifications: Record<string, number> = {};
  scored.forEach((r) => {
    classifications[r.classification] = (classifications[r.classification] || 0) + 1;
  });

  const aiScores = scored.filter((r) => r.aiScore !== null).map((r) => r.aiScore!);
  const humanScores = scored.filter((r) => r.humanScore !== null).map((r) => r.humanScore!);
  const avgAi = aiScores.length > 0 ? aiScores.reduce((a, b) => a + b, 0) / aiScores.length : 0;
  const avgHuman = humanScores.length > 0 ? humanScores.reduce((a, b) => a + b, 0) / humanScores.length : 0;
  const avgDivergence = scored.filter((r) => r.divergence !== null).length > 0
    ? scored.reduce((a, r) => a + (r.divergence || 0), 0) / scored.filter((r) => r.divergence !== null).length
    : 0;

  const aiUsageStats: Record<string, number> = {};
  submissions.forEach((s) => {
    const usage = s.aiUsage || "none";
    aiUsageStats[usage] = (aiUsageStats[usage] || 0) + 1;
  });

  const classColors: Record<string, string> = {
    Destaque: "bg-sage",
    Aprovado: "bg-accent",
    Borderline: "bg-warning",
    Reprovado: "bg-danger",
  };

  function exportCSV() {
    const header = "Posição,Equipe,IA,Banca,Δ,Final,Classificação\n";
    const rows = scored
      .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
      .map((r, i) => {
        const team = teams.find((t) => t.id === r.teamId);
        return `${i + 1},Equipe ${team?.number},${r.aiScore?.toFixed(1) ?? ""},${r.humanScore?.toFixed(1) ?? ""},${r.divergence?.toFixed(1) ?? ""},${r.finalScore?.toFixed(2)},${r.classification}`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-avaliacao.csv";
    a.click();
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Relatório da Turma</h2>
          <p className="text-dim text-sm mt-1">{scored.length} equipes avaliadas · {candidates.length} candidatos</p>
        </div>
        <Button variant="secondary" onClick={exportCSV} disabled={scored.length === 0}>
          📥 Exportar CSV
        </Button>
      </div>

      {scored.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-dim">Nenhuma avaliação concluída ainda</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Média", value: avg.toFixed(2), sub: "Score final" },
              { label: "Mediana", value: median.toFixed(2), sub: "Score final" },
              { label: "Maior", value: max.toFixed(2), sub: "Melhor equipe" },
              { label: "Menor", value: min.toFixed(2), sub: "Pior equipe" },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="text-center py-5">
                  <p className="text-3xl font-bold font-mono text-cream">{stat.value}</p>
                  <p className="text-xs text-dim mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Classification Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Classificação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["Destaque", "Aprovado", "Borderline", "Reprovado"].map((cls) => {
                  const count = classifications[cls] || 0;
                  const pct = scored.length > 0 ? (count / scored.length) * 100 : 0;
                  return (
                    <div key={cls} className="flex items-center gap-4">
                      <span className="text-sm text-cream w-24">{cls}</span>
                      <div className="flex-1 h-6 rounded bg-bg-elevated overflow-hidden">
                        <div
                          className={`h-full rounded transition-all duration-700 ${classColors[cls] || "bg-dim"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-mono text-dim w-20 text-right">
                        {count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* IA vs Banca */}
          <Card>
            <CardHeader>
              <CardTitle>IA vs Banca</CardTitle>
              <CardDescription>Comparação entre avaliação automática e humana</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-bg-surface rounded-lg">
                  <p className="text-2xl font-bold font-mono text-cream">{avgAi.toFixed(2)}</p>
                  <p className="text-xs text-dim mt-1">Média IA</p>
                </div>
                <div className="text-center p-4 bg-bg-surface rounded-lg">
                  <p className="text-2xl font-bold font-mono text-cream">{avgHuman.toFixed(2)}</p>
                  <p className="text-xs text-dim mt-1">Média Banca</p>
                </div>
                <div className="text-center p-4 bg-bg-surface rounded-lg">
                  <p className={`text-2xl font-bold font-mono ${avgDivergence <= 1.5 ? "text-sage" : avgDivergence <= 2.5 ? "text-warning" : "text-danger"}`}>
                    {avgDivergence.toFixed(2)}
                  </p>
                  <p className="text-xs text-dim mt-1">Divergência média</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Usage Declaration */}
          <Card>
            <CardHeader>
              <CardTitle>Uso de IA Declarado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: "none", label: "Não usou" },
                  { key: "research", label: "Pesquisa" },
                  { key: "writing", label: "Escrita" },
                  { key: "extensive", label: "Extensivo" },
                ].map((opt) => (
                  <div key={opt.key} className="text-center p-4 bg-bg-surface rounded-lg">
                    <p className="text-xl font-bold font-mono text-cream">{aiUsageStats[opt.key] || 0}</p>
                    <p className="text-xs text-dim mt-1">{opt.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
