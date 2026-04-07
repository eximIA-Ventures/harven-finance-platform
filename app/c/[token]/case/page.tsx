export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCandidateByToken } from "@/lib/actions/candidates";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function CasePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getCandidateByToken(token);
  if (!data || !data.evaluation) notFound();

  const { evaluation } = data;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/5 bg-[#141416]/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <img
            src="/logos/harven-finance-dark.png"
            alt="Harven Finance"
            className="h-6 w-auto"
          />
          <span className="text-sm font-semibold text-cream">Finance Portal</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6 animate-fade-in-up">
        <div>
          <Link href={`/c/${token}`} className="text-sm text-dim hover:text-cream transition-colors">
            ← Voltar ao painel
          </Link>
          <h2 className="text-2xl font-serif mt-4">Material do Case</h2>
          <p className="text-dim text-sm mt-1">{evaluation.name}</p>
        </div>

        {/* Case File */}
        {evaluation.caseFileUrl ? (
          <Card>
            <CardHeader>
              <CardTitle> {evaluation.caseFileName || "Case Study"}</CardTitle>
              <CardDescription>Clique para baixar o material</CardDescription>
            </CardHeader>
            <CardContent>
              <a
                href={evaluation.caseFileUrl}
                download
                className="inline-flex items-center gap-2 h-12 px-8 bg-accent text-[#0A0A0A] rounded-lg font-medium hover:brightness-110 transition-all"
              >
                Baixar Case (PDF)
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </a>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-dim">Material do case ainda não disponível</p>
              <p className="text-dim/60 text-xs mt-2">
                O organizador ainda não fez upload do material. Verifique novamente em breve.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {evaluation.instructions && (
          <Card>
            <CardHeader>
              <CardTitle>Instruções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-cream-dim whitespace-pre-wrap leading-relaxed">
                {evaluation.instructions}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deadline reminder */}
        {evaluation.deadline && (
          <Card className="border-accent/20">
            <CardContent className="flex items-center gap-3 py-4">
              
              <div>
                <p className="text-sm font-medium text-cream">Prazo de entrega</p>
                <p className="text-xs text-dim">
                  {new Date(evaluation.deadline).toLocaleDateString("pt-BR")} às{" "}
                  {new Date(evaluation.deadline).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit CTA */}
        <div className="text-center pt-4">
          <Link href={`/c/${token}/submit`}>
            <Button size="lg">
              Enviar meu Case →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
