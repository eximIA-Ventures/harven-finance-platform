export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  evaluations,
  teams,
  consolidatedResults,
  phases,
  submissions,
  aiResults,
  humanReviews,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const classVariant: Record<string, "success" | "info" | "warning" | "danger"> = {
  Destaque: "success",
  Aprovado: "info",
  Borderline: "warning",
  Reprovado: "danger",
};

interface PhaseScores {
  aiScore: number | null;
  humanScore: number | null;
  humanCount: number;
}

interface TeamRanking {
  team: { id: string; number: number };
  case: PhaseScores;
  pitch: PhaseScores;
  finalScore: number | null;
  classification: string;
  divergence: number | null;
  divergenceFlag: string;
}

export default async function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const evaluation = await db.query.evaluations.findFirst({
    where: eq(evaluations.id, id),
  });
  if (!evaluation) notFound();

  const teamList = await db.query.teams.findMany({
    where: eq(teams.evaluationId, id),
    orderBy: (t, { asc }) => [asc(t.number)],
  });

  const phaseList = await db.query.phases.findMany({
    where: eq(phases.evaluationId, id),
    orderBy: (p, { asc }) => [asc(p.order)],
  });

  const casePhase = phaseList.find((p) => p.slug === "case");
  const pitchPhase = phaseList.find((p) => p.slug === "pitch");
  const hasPitch = !!pitchPhase;

  // Build rankings with per-phase scores
  const rankings: TeamRanking[] = await Promise.all(
    teamList.map(async (team) => {
      // Get submissions for this team
      const teamSubs = await db.query.submissions.findMany({
        where: eq(submissions.teamId, team.id),
      });

      async function getPhaseScores(phaseId: string | undefined): Promise<PhaseScores> {
        if (!phaseId) return { aiScore: null, humanScore: null, humanCount: 0 };

        let aiScore: number | null = null;
        let humanScores: number[] = [];

        // Find submission for this phase
        const phaseSub = teamSubs.find((s) => s.phaseId === phaseId);
        if (phaseSub) {
          // AI score
          const aiRes = await db.query.aiResults.findFirst({
            where: eq(aiResults.submissionId, phaseSub.id),
          });
          if (aiRes) aiScore = aiRes.finalScore;

          // Human scores
          const reviews = await db.query.humanReviews.findMany({
            where: eq(humanReviews.submissionId, phaseSub.id),
          });
          humanScores = reviews.map((r) => r.overallScore);
        }

        const humanAvg =
          humanScores.length > 0
            ? humanScores.reduce((a, b) => a + b, 0) / humanScores.length
            : null;

        return {
          aiScore,
          humanScore: humanAvg ? Math.round(humanAvg * 100) / 100 : null,
          humanCount: humanScores.length,
        };
      }

      const caseScores = await getPhaseScores(casePhase?.id);
      const pitchScores = await getPhaseScores(pitchPhase?.id);

      // Get consolidated result for final score
      const consolidated = await db.query.consolidatedResults.findFirst({
        where: eq(consolidatedResults.teamId, team.id),
      });

      return {
        team,
        case: caseScores,
        pitch: pitchScores,
        finalScore: consolidated?.finalScore ?? null,
        classification: consolidated?.classification ?? "—",
        divergence: consolidated?.divergence ?? null,
        divergenceFlag: consolidated?.divergenceFlag ?? "ok",
      };
    })
  );

  const sorted = rankings
    .filter((r) => r.finalScore !== null)
    .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

  const noResults = rankings.filter((r) => r.finalScore === null);
  const avgDivergence =
    sorted.length > 0
      ? sorted.reduce((a, r) => a + (r.divergence ?? 0), 0) / sorted.length
      : 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-serif">Ranking — {evaluation.name}</h2>
        <p className="text-dim text-sm mt-1">
          {sorted.length} equipes avaliadas · Média Δ: {avgDivergence.toFixed(2)}
        </p>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim" rowSpan={2}>
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim" rowSpan={2}>
                    Equipe
                  </th>
                  {/* Case columns */}
                  <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-accent border-b border-[var(--border-color)]" colSpan={2}>
                    Case Study ({casePhase ? `${(casePhase.weight * 100).toFixed(0)}%` : "60%"})
                  </th>
                  {/* Pitch columns */}
                  {hasPitch && (
                    <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-sage border-b border-[var(--border-color)]" colSpan={2}>
                      Pitch ({pitchPhase ? `${(pitchPhase.weight * 100).toFixed(0)}%` : "40%"})
                    </th>
                  )}
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-dim" rowSpan={2}>
                    Δ
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-dim" rowSpan={2}>
                    Final
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim" rowSpan={2}>
                    Status
                  </th>
                </tr>
                <tr className="border-b border-[var(--border-color)]">
                  {/* Case sub-headers */}
                  <th className="px-3 py-2 text-center text-[9px] font-medium text-accent/70">IA</th>
                  <th className="px-3 py-2 text-center text-[9px] font-medium text-accent/70">Banca</th>
                  {/* Pitch sub-headers */}
                  {hasPitch && (
                    <>
                      <th className="px-3 py-2 text-center text-[9px] font-medium text-sage/70">IA</th>
                      <th className="px-3 py-2 text-center text-[9px] font-medium text-sage/70">Banca</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, idx) => (
                  <tr
                    key={row.team.id}
                    className="border-b border-[var(--border-color)] hover:bg-bg-surface transition-colors"
                  >
                    <td className="px-4 py-4 font-mono text-dim">{idx + 1}</td>
                    <td className="px-4 py-4 font-medium text-cream">
                      Equipe {row.team.number}
                    </td>

                    {/* Case IA */}
                    <td className="px-3 py-4 text-center">
                      <span className={`font-mono font-medium ${scoreColor(row.case.aiScore)}`}>
                        {row.case.aiScore?.toFixed(1) ?? "—"}
                      </span>
                    </td>
                    {/* Case Banca */}
                    <td className="px-3 py-4 text-center">
                      <span className={`font-mono font-medium ${scoreColor(row.case.humanScore)}`}>
                        {row.case.humanScore?.toFixed(1) ?? "—"}
                      </span>
                      {row.case.humanCount > 0 && (
                        <span className="text-[9px] text-dim ml-0.5">
                          ({row.case.humanCount})
                        </span>
                      )}
                    </td>

                    {/* Pitch IA */}
                    {hasPitch && (
                      <td className="px-3 py-4 text-center">
                        <span className={`font-mono font-medium ${scoreColor(row.pitch.aiScore)}`}>
                          {row.pitch.aiScore?.toFixed(1) ?? "—"}
                        </span>
                      </td>
                    )}
                    {/* Pitch Banca */}
                    {hasPitch && (
                      <td className="px-3 py-4 text-center">
                        <span className={`font-mono font-medium ${scoreColor(row.pitch.humanScore)}`}>
                          {row.pitch.humanScore?.toFixed(1) ?? "—"}
                        </span>
                        {row.pitch.humanCount > 0 && (
                          <span className="text-[9px] text-dim ml-0.5">
                            ({row.pitch.humanCount})
                          </span>
                        )}
                      </td>
                    )}

                    {/* Divergence */}
                    <td className="px-4 py-4 text-right">
                      {row.divergence !== null ? (
                        <span
                          className={`font-mono font-medium ${
                            row.divergenceFlag === "ok"
                              ? "text-sage"
                              : row.divergenceFlag === "warning"
                              ? "text-warning"
                              : "text-danger"
                          }`}
                        >
                          {row.divergence.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-dim">—</span>
                      )}
                    </td>

                    {/* Final */}
                    <td className="px-4 py-4 text-right">
                      <span className="text-lg font-bold font-mono text-cream">
                        {row.finalScore?.toFixed(2) ?? "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <Badge variant={classVariant[row.classification] ?? "default"}>
                        {row.classification}
                        {row.divergenceFlag === "warning" && " ⚠"}
                        {row.divergenceFlag === "critical" && " 🔴"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {noResults.length > 0 && (
        <Card>
          <CardContent>
            <p className="text-dim text-sm">
              {noResults.length} equipe(s) ainda sem avaliação:{" "}
              {noResults.map((r) => `Equipe ${r.team.number}`).join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Legenda</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-dim">
          <div>
            <span className="text-accent">Case IA / Banca:</span> Avaliação da fase case study
          </div>
          {hasPitch && (
            <div>
              <span className="text-sage">Pitch IA / Banca:</span> Avaliação da fase pitch
            </div>
          )}
          <div>
            <span className="text-cream">Δ:</span> Divergência |IA - Banca| — ≤1.5{" "}
            <span className="text-sage">OK</span>, 1.5-2.5{" "}
            <span className="text-warning">⚠</span>, &gt;2.5{" "}
            <span className="text-danger">🔴</span>
          </div>
          <div>
            <span className="text-cream">Final:</span> (IA × 55%) + (Banca × 45%) consolidado entre fases
          </div>
          <div>
            <span className="text-cream">(N):</span> Número de avaliadores da banca
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-dim";
  if (score >= 8) return "text-sage";
  if (score >= 7) return "text-accent";
  if (score >= 5) return "text-warning";
  return "text-danger";
}
