"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";
import { CASE_CRITERIA, getSections, calculateScore, type EvalCriterion } from "@/lib/evaluation-criteria";

function ScoreSelector({ value, onChange, rubric }: { value: number; onChange: (v: number) => void; rubric: EvalCriterion["rubric"] }) {
  const [showRubric, setShowRubric] = useState(false);
  const color = value >= 8 ? "text-sage" : value >= 6 ? "text-accent" : value >= 4 ? "text-warning" : "text-danger";
  const bgColor = value >= 8 ? "bg-sage" : value >= 6 ? "bg-accent" : value >= 4 ? "bg-warning" : "bg-danger";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                n === value
                  ? `${bgColor} text-[#0A0A0A] scale-110 shadow-lg`
                  : n <= value
                  ? `${bgColor}/20 ${color}`
                  : "bg-bg-elevated text-dim hover:bg-bg-elevated"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className={`text-lg font-bold font-mono ${color}`}>{value}</span>
      </div>
      <button onClick={() => setShowRubric(!showRubric)} className="text-[10px] text-dim hover:text-cream transition-colors">
        {showRubric ? "Esconder rubrica ▲" : "Ver rubrica ▼"}
      </button>
      {showRubric && (
        <div className="p-3 bg-bg-surface rounded-lg space-y-1.5 text-[11px]">
          {Object.entries(rubric).map(([range, desc]) => (
            <div key={range} className="flex gap-3">
              <span className="text-accent font-mono font-bold w-10 shrink-0">{range}</span>
              <span className="text-dim">{desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamReviewPage() {
  const { token, teamId } = useParams<{ token: string; teamId: string }>();
  const router = useRouter();
  const [teamData, setTeamData] = useState<{ team?: { number: number }; members?: Array<{ name: string }>; submissionText?: string; fileName?: string } | null>(null);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    CASE_CRITERIA.forEach((c) => { initial[c.id] = 5; });
    return initial;
  });
  const [impression, setImpression] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/eval/${token}/${teamId}`)
      .then((r) => r.json())
      .then(setTeamData)
      .catch(() => {});
  }, [token, teamId]);

  const { sectionScores, finalScore } = calculateScore(CASE_CRITERIA, scores);
  const sections = getSections(CASE_CRITERIA);

  async function handleSubmit() {
    setIsLoading(true);
    try {
      await fetch(`/api/eval/${token}/${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analyticalScore: sectionScores["Qualidade da Análise"] ?? 5,
          reasoningScore: sectionScores["Raciocínio e Tese"] ?? 5,
          originalityScore: sectionScores["Identificação de Riscos"] ?? 5,
          communicationScore: sectionScores["Apresentação e Comunicação"] ?? 5,
          impression,
          recommendation: finalScore >= 7 ? "approve" : finalScore >= 5 ? "concerns" : "reject",
          detailedScores: scores,
          sectionScores,
          calculatedScore: finalScore,
        }),
      });
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            
            <h3 className="text-xl font-serif text-sage">Avaliação enviada!</h3>
            <p className="text-dim text-sm mt-2">
              Score final: <span className="text-cream font-mono font-bold">{finalScore.toFixed(2)}</span>/10
            </p>
            <Button variant="secondary" className="mt-6" onClick={() => router.push(`/eval/${token}`)}>
              Voltar ao painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logos/harven-finance-dark.png" alt="Harven Finance" className="h-6" />
          <span className="text-sm font-semibold text-cream">Finance Portal</span>
          <span className="text-dim">·</span>
          <span className="text-sm text-dim">Avaliação de Banca</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-dim uppercase tracking-wider">Score calculado</p>
            <p className={`text-xl font-bold font-mono ${finalScore >= 8 ? "text-sage" : finalScore >= 7 ? "text-accent" : finalScore >= 5 ? "text-warning" : "text-danger"}`}>
              {finalScore.toFixed(2)}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Team Info */}
        <div>
          <h2 className="text-2xl font-serif text-cream">
            Equipe {teamData?.team?.number || ""}
          </h2>
          <p className="text-dim text-sm mt-1">
            {teamData?.members?.map((m) => m.name).join(", ")}
          </p>
        </div>

        {/* Download submission */}
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              
              <div>
                <span className="text-sm font-medium text-cream">
                  {teamData?.fileName || "Submissão da equipe"}
                </span>
                <p className="text-[10px] text-dim">Leia o case antes de avaliar</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => {
                const el = document.getElementById("submission-text");
                if (el) el.classList.toggle("hidden");
              }}>
                Ler inline
              </Button>
            </div>
          </CardContent>
          <div id="submission-text" className="hidden border-t border-[var(--border-color)]">
            <div className="max-h-[500px] overflow-y-auto p-6 text-sm text-cream-dim whitespace-pre-wrap leading-relaxed font-mono">
              {teamData?.submissionText || "Submissão não disponível"}
            </div>
          </div>
        </Card>

        {/* Scoring sections */}
        {sections.map((section) => (
          <Card key={section.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{section.name}</CardTitle>
                  <CardDescription>Peso: {(section.weight * 100).toFixed(0)}% do score final</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-dim">Score da seção</p>
                  <p className="text-lg font-bold font-mono text-cream">
                    {(sectionScores[section.name] ?? 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.criteria.map((criterion) => (
                <div key={criterion.id} className="space-y-3 pb-5 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                  <div>
                    <h4 className="text-sm font-semibold text-cream">{criterion.name}</h4>
                    <p className="text-[11px] text-dim mt-0.5">{criterion.description}</p>
                    <p className="text-[10px] text-accent/60 mt-1 italic">{criterion.guide}</p>
                  </div>
                  <ScoreSelector
                    value={scores[criterion.id]}
                    onChange={(v) => setScores({ ...scores, [criterion.id]: v })}
                    rubric={criterion.rubric}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sections.map((section) => (
              <div key={section.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-cream">{section.name}</span>
                  <span className="text-[10px] text-dim">({(section.weight * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex items-center gap-3 w-48">
                  <ScoreBar score={sectionScores[section.name] ?? 0} size="sm" />
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-sm font-semibold text-cream">Score Final Ponderado</span>
              <span className={`text-2xl font-bold font-mono ${finalScore >= 8 ? "text-sage" : finalScore >= 7 ? "text-accent" : finalScore >= 5 ? "text-warning" : "text-danger"}`}>
                {finalScore.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Impression + Submit */}
        <Card>
          <CardContent className="space-y-4">
            <Textarea
              label="Impressão geral (opcional)"
              placeholder="Comentários sobre a equipe, pontos fortes, sugestões..."
              value={impression}
              onChange={(e) => setImpression(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center justify-between">
              <Button variant="secondary" onClick={() => router.push(`/eval/${token}`)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} isLoading={isLoading} size="lg">
                Enviar Avaliação ({finalScore.toFixed(2)}/10)
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
