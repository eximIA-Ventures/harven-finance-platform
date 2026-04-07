export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCandidateByToken } from "@/lib/actions/candidates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBar } from "@/components/ui/score-bar";

const classVariant: Record<string, "success" | "info" | "warning" | "danger"> = {
  Destaque: "success",
  Aprovado: "info",
  Borderline: "warning",
  Reprovado: "danger",
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getCandidateByToken(token);
  if (!data || !data.evaluation) notFound();

  const { candidate, evaluation, team, consolidated, aiResult } = data;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-lg font-semibold">
            Harven <span className="text-accent">Finance Portal</span>
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Resultado</h2>
          <p className="text-text-secondary">
            {evaluation.name}
            {team && ` · Equipe ${team.number}`}
          </p>
        </div>

        {consolidated ? (
          <>
            {/* Score card */}
            <Card className={`border-${classVariant[consolidated.classification || ""] || "border"}/30`}>
              <CardContent className="text-center py-8">
                <div className="text-5xl font-bold font-mono mb-2">
                  {consolidated.finalScore?.toFixed(2)}
                </div>
                <div className="text-text-muted mb-4">de 10.00</div>
                <Badge
                  variant={classVariant[consolidated.classification || ""] || "default"}
                  className="text-base px-4 py-1"
                >
                  {consolidated.classification}
                </Badge>
              </CardContent>
            </Card>

            {/* Breakdown */}
            {consolidated.aiScore !== null && (
              <Card>
                <CardHeader>
                  <CardTitle>Composição do Score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Avaliação IA (55%)</span>
                      <span className="font-mono">
                        {consolidated.aiScore?.toFixed(1)}
                      </span>
                    </div>
                    <ScoreBar score={consolidated.aiScore || 0} />
                  </div>
                  {consolidated.humanScore !== null && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          Banca Avaliadora (45%)
                          {consolidated.humanReviewCount
                            ? ` · ${consolidated.humanReviewCount} avaliador(es)`
                            : ""}
                        </span>
                        <span className="font-mono">
                          {consolidated.humanScore?.toFixed(1)}
                        </span>
                      </div>
                      <ScoreBar score={consolidated.humanScore || 0} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Feedback */}
            {consolidated.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {consolidated.feedback}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* AI detailed feedback */}
            {aiResult?.feedback && !consolidated.feedback && (
              <Card>
                <CardHeader>
                  <CardTitle>Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {aiResult.feedback}
                  </p>
                  {aiResult.profile && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <span className="text-sm text-text-muted">Perfil identificado: </span>
                      <Badge variant="info">{aiResult.profile}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-text-muted text-lg">
                Resultados ainda não disponíveis
              </p>
              <p className="text-text-muted text-sm mt-2">
                Você será notificado quando a avaliação estiver concluída
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
