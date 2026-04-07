export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvaluatorByToken } from "@/lib/actions/human-review";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EvaluatorDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getEvaluatorByToken(token);
  if (!data) notFound();

  const { evaluator, teams } = data;
  const reviewed = teams.filter((t) => t.hasReviewed).length;
  const total = teams.filter((t) => t.submissions.length > 0).length;

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold">
            Harven <span className="text-accent">Finance Portal</span>
          </h1>
          <span className="text-sm text-text-secondary">Banca Avaliadora</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Olá, {evaluator.name}</h2>
          <p className="text-text-secondary">
            {evaluator.role && `${evaluator.role} · `}
            {reviewed}/{total} equipes avaliadas
          </p>
        </div>

        <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all"
            style={{ width: `${total > 0 ? (reviewed / total) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-3">
          {teams
            .filter((t) => t.submissions.length > 0)
            .map((team) => (
              <Link key={team.id} href={`/eval/${token}/${team.id}`}>
                <Card className="hover:border-border-hover transition-colors cursor-pointer mb-3">
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Equipe {team.number}</h3>
                      <p className="text-sm text-text-secondary">
                        {team.members.map((m) => m.name).join(", ")}
                      </p>
                    </div>
                    {team.hasReviewed ? (
                      <Badge variant="success">Avaliado</Badge>
                    ) : (
                      <Badge variant="info">Avaliar →</Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </main>
    </div>
  );
}
