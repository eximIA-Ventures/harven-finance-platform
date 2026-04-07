export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvaluationFull } from "@/lib/actions/evaluations";
import { Badge } from "@/components/ui/badge";
import { Users, Layers, FileText, UserCheck, Upload, Shuffle, Sparkles, ClipboardCheck } from "lucide-react";
import { PSHeader } from "@/components/ps-header";

const statusVariant: Record<string, "default" | "accent" | "warning" | "success"> = {
  draft: "default",
  open: "accent",
  evaluating: "warning",
  completed: "success",
};
const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  evaluating: "Avaliando",
  completed: "Concluído",
};

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const evaluation = await getEvaluationFull(id);
  if (!evaluation) notFound();

  const candidateCount = evaluation.candidates.length;
  const teamCount = evaluation.teams.length;
  const evaluatorCount = evaluation.evaluators.length;
  const submitted = evaluation.candidates.filter((c) => c.status === "submitted").length;
  const evaluated = evaluation.candidates.filter((c) => c.status === "evaluated" || c.status === "completed").length;

  const stats = [
    { value: candidateCount, label: "Candidatos", iconBg: "bg-accent/15", iconColor: "text-accent", icon: <Users size={20} /> },
    { value: teamCount, label: "Equipes", iconBg: "bg-sage/15", iconColor: "text-sage", icon: <Layers size={20} /> },
    { value: submitted, label: "Submissoes", iconBg: "bg-atom/15", iconColor: "text-atom", icon: <FileText size={20} /> },
    { value: evaluatorCount, label: "Avaliadores", iconBg: "bg-molecule/15", iconColor: "text-molecule", icon: <UserCheck size={20} /> },
  ];

  const workflows = [
    {
      title: "Importar Candidatos",
      desc: "Upload CSV do Google Forms",
      href: `/admin/${id}/candidates`,
      count: candidateCount > 0 ? `${candidateCount} importados` : "Pendente",
      gradient: "from-accent/20 to-accent/5",
      iconBg: "bg-accent/15",
      iconColor: "text-accent",
      done: candidateCount > 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0v6m3-3H9.75M8.25 3H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      title: "Sortear Equipes",
      desc: "Formar equipes por sorteio",
      href: `/admin/${id}/draw`,
      count: teamCount > 0 ? `${teamCount} equipes` : "Não sorteado",
      gradient: "from-sage/15 to-sage/5",
      iconBg: "bg-sage/15",
      iconColor: "text-sage",
      done: teamCount > 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
    },
    {
      title: "Case & Avaliação IA",
      desc: "Upload case + rodar avaliação",
      href: `/admin/${id}/evaluate`,
      count: evaluation.caseFileUrl ? "Case uploaded" : "Pendente",
      gradient: "from-atom/15 to-atom/5",
      iconBg: "bg-atom/15",
      iconColor: "text-atom",
      done: !!evaluation.caseFileUrl,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
    },
    {
      title: "Banca Avaliadora",
      desc: "Gerenciar avaliadores humanos",
      href: `/admin/${id}/evaluators`,
      count: evaluatorCount > 0 ? `${evaluatorCount} avaliadores` : "Nenhum",
      gradient: "from-molecule/15 to-molecule/5",
      iconBg: "bg-molecule/15",
      iconColor: "text-molecule",
      done: evaluatorCount > 0,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const resultLinks = [
    { title: "Central de Candidatos", desc: "Notas, ranking e decisoes", href: `/admin/${id}/candidates`, icon: <Users size={16} /> },
    { title: "Sorteio de Equipes", desc: "Formar e editar grupos", href: `/admin/${id}/draw`, icon: <Shuffle size={16} /> },
    { title: "Avaliacao", desc: "IA + Banca por grupo", href: `/admin/${id}/evaluation`, icon: <Sparkles size={16} /> },
  ];

  return (
    <div className="space-y-6">
      <PSHeader evaluationId={id} />

      {/* Stat Cards */}
      <section>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl bg-bg-card ring-1 ring-[var(--border-color)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:ring-accent/20"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}>
                {stat.icon}
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-dim">{stat.label}</p>
              <p className="text-2xl font-bold text-cream">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Phases */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-dim mb-4">Fases da Avaliação</h2>
        <div className="flex gap-3">
          {evaluation.phases.map((phase) => (
            <div key={phase.id} className="flex-1 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-5 transition-all hover:ring-accent/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-cream">{phase.name}</span>
                <span className="text-xs font-mono text-accent">{(phase.weight * 100).toFixed(0)}%</span>
              </div>
              <p className="text-[10px] text-dim">
                {phase.sections.length} seções · {phase.sections.reduce((a, s) => a + s.criteria.length, 0)} critérios
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg ring-1 ring-[var(--border-color)] bg-bg-card p-3 text-center">
          <span className="text-xs text-dim">
            Score Final = <span className="text-accent font-mono">(IA × 55%)</span> + <span className="text-sage font-mono">(Banca × 45%)</span> · Divergence check automático
          </span>
        </div>
      </section>

      {/* Workflow Cards */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-dim mb-4">Fluxo de Trabalho</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {workflows.map((wf) => (
            <Link key={wf.title} href={wf.href} className="group">
              <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${wf.gradient} ring-1 ring-[var(--border-color)] p-5 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] group-hover:ring-accent/20`}>
                {wf.done && (
                  <span className="absolute right-3 top-3 rounded-full bg-sage/10 px-2 py-0.5 text-[9px] font-semibold text-sage ring-1 ring-sage/20">
                    
                  </span>
                )}
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${wf.iconBg} ${wf.iconColor}`}>
                  {wf.icon}
                </div>
                <h3 className="text-sm font-semibold text-cream">{wf.title}</h3>
                <p className="mt-1 text-xs text-dim">{wf.desc}</p>
                <p className="mt-2 text-[10px] font-mono text-dim/60">{wf.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Results & Tools */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-dim mb-4">Resultados & Ferramentas</h2>
        <div className="space-y-1">
          {resultLinks.map((item) => (
            <Link key={item.title} href={item.href} className="group block">
              <div className="flex items-center gap-4 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4 transition-all duration-200 hover:ring-accent/20 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-cream group-hover:text-accent transition-colors">{item.title}</h3>
                  <p className="text-[10px] text-dim">{item.desc}</p>
                </div>
                <svg className="w-4 h-4 shrink-0 text-dim/30 transition-all group-hover:text-accent group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
