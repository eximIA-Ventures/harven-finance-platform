export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCandidateByToken } from "@/lib/actions/candidates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, BarChart3, Clock, ChevronRight } from "lucide-react";
import { CandidateHeader } from "@/components/candidate-header";

const statusLabel: Record<string, string> = {
  pending: "Aguardando submissao",
  submitted: "Case enviado",
  evaluated: "Avaliado",
  completed: "Concluido",
};

const statusVariant: Record<string, "default" | "accent" | "warning" | "success"> = {
  pending: "default",
  submitted: "accent",
  evaluated: "warning",
  completed: "success",
};

export default async function CandidateDashboard({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getCandidateByToken(token);
  if (!data || !data.evaluation) notFound();

  const { candidate, evaluation, team, phases, submissions } = data;
  const casePhase = phases.find((p) => p.slug === "case");
  const hasSubmitted = submissions.length > 0;
  const deadline = evaluation.deadline ? new Date(evaluation.deadline) : null;
  const isExpired = deadline ? new Date() > deadline : false;

  return (
    <div className="min-h-screen bg-bg">
      <CandidateHeader name={candidate.name} />

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-serif text-cream">Ola, {candidate.name}</h1>
          <p className="text-dim text-sm mt-1">{evaluation.name}</p>
        </div>

        {/* Status + Team */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-4">
              <p className="text-[10px] text-dim uppercase tracking-wider mb-1">Status</p>
              <Badge variant={statusVariant[candidate.status] || "default"}>
                {statusLabel[candidate.status] || candidate.status}
              </Badge>
            </CardContent>
          </Card>
          {team && (
            <Card>
              <CardContent className="py-4 text-right">
                <p className="text-[10px] text-dim uppercase tracking-wider mb-1">Equipe</p>
                <p className="text-2xl font-bold text-accent font-mono">{team.number}</p>
              </CardContent>
            </Card>
          )}
          {deadline && (
            <Card>
              <CardContent className="py-4">
                <p className="text-[10px] text-dim uppercase tracking-wider mb-1">Prazo</p>
                <p className="text-sm font-medium text-cream">
                  {deadline.toLocaleDateString("pt-BR")}
                </p>
                <p className="text-[10px] text-dim">
                  {deadline.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Deadline warning */}
        {deadline && !hasSubmitted && !isExpired && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 ring-1 ring-warning/20">
            <Clock size={18} className="text-warning shrink-0" />
            <div>
              <p className="text-sm font-medium text-cream">Prazo de entrega</p>
              <p className="text-xs text-dim">
                {deadline.toLocaleDateString("pt-BR")} as {deadline.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Badge variant="warning" className="ml-auto">Em andamento</Badge>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* Download case */}
          <Link href={`/c/${token}/case`}>
            <Card className="hover:ring-accent/20 transition-all cursor-pointer group">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <FileText size={18} className="text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-cream group-hover:text-accent transition-colors">Material do Case</h3>
                  <p className="text-[10px] text-dim">{evaluation.caseFileUrl ? "Baixar PDF e instrucoes" : "Ver instrucoes do case"}</p>
                </div>
                <ChevronRight size={16} className="text-dim/30 group-hover:text-accent transition-colors" />
              </CardContent>
            </Card>
          </Link>

          {/* Submit */}
          {!hasSubmitted && !isExpired && casePhase && (
            <Link href={`/c/${token}/submit`}>
              <Card className="ring-accent/20 hover:ring-accent/40 transition-all cursor-pointer group">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15">
                    <Upload size={18} className="text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-accent">Enviar Case</h3>
                    <p className="text-[10px] text-dim">Upload do seu relatorio</p>
                  </div>
                  <ChevronRight size={16} className="text-accent/30 group-hover:text-accent transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Submitted confirmation */}
          {hasSubmitted && (
            <Card className="ring-success/20">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <FileText size={18} className="text-success" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-success">Case enviado</h3>
                  <p className="text-[10px] text-dim">
                    {submissions[0].fileName || "case"} -- {new Date(submissions[0].submittedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {(candidate.status === "evaluated" || candidate.status === "completed") && (
            <Link href={`/c/${token}/result`}>
              <Card className="hover:ring-accent/20 transition-all cursor-pointer group">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage/10">
                    <BarChart3 size={18} className="text-sage" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-cream group-hover:text-accent transition-colors">Ver Resultado</h3>
                    <p className="text-[10px] text-dim">Scorecard e feedback</p>
                  </div>
                  <ChevronRight size={16} className="text-dim/30 group-hover:text-accent transition-colors" />
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Instructions */}
        {evaluation.instructions && (
          <Card>
            <CardContent className="py-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-dim mb-2">Instrucoes</h3>
              <p className="text-sm text-cream leading-relaxed whitespace-pre-wrap">{evaluation.instructions}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
