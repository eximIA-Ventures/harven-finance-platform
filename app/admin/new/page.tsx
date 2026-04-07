"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { templates } from "@/lib/db/seed-templates";
import { CheckCircle, Copy, ArrowRight, ChevronLeft, Sparkles, FileText, Settings, ClipboardCheck } from "lucide-react";

const STEPS = [
  { label: "Informacoes", icon: FileText },
  { label: "Template", icon: Sparkles },
  { label: "Configuracoes", icon: Settings },
  { label: "Confirmar", icon: ClipboardCheck },
];

export default function NewEvaluationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "case-study",
    description: "",
    instructions: "",
    deadline: "",
    password: "",
  });

  const selectedTemplate = templates[form.type] || templates["case-study"];

  async function handleSubmit() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, template: selectedTemplate }),
      });
      const { id } = await res.json();
      // Auto-login
      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evalId: id, password: form.password }),
      });
      setCreatedId(id);
    } catch {
      setIsLoading(false);
    }
  }

  function handleCopyId() {
    if (!createdId) return;
    navigator.clipboard.writeText(createdId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ── Success state ── */
  if (createdId) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-8 animate-fade-in-up">
        {/* Success icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-sage/10 animate-ping" />
          <div className="relative w-20 h-20 bg-sage/15 rounded-full flex items-center justify-center">
            <CheckCircle className="w-9 h-9 text-sage" strokeWidth={1.5} />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif text-cream">Avaliacao Criada</h2>
          <p className="text-sm text-dim">Tudo pronto. Guarde o ID abaixo para acessar o painel.</p>
        </div>

        {/* ID card */}
        <div className="rounded-2xl ring-1 ring-[var(--border-color)] bg-bg-card p-6 space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-dim">
            ID da Avaliacao
          </p>
          <code className="block text-3xl font-mono font-bold text-accent tracking-widest">
            {createdId}
          </code>
          <p className="text-[11px] text-dim/60">Senha: a que voce definiu no passo 1</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push(`/admin/${createdId}`)}
            className="h-12 w-full bg-accent text-[#0A0A0A] rounded-xl font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            Ir para o Dashboard
            <ArrowRight size={16} />
          </button>
          <button
            onClick={handleCopyId}
            className="h-10 w-full rounded-xl border border-[var(--border-color)] text-sm text-cream hover:border-accent/30 hover:bg-bg-elevated transition-all flex items-center justify-center gap-2"
          >
            <Copy size={14} className={copied ? "text-sage" : "text-dim"} />
            {copied ? "Copiado!" : "Copiar ID"}
          </button>
        </div>
      </div>
    );
  }

  /* ── Wizard ── */
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-serif text-cream">Nova Avaliacao</h2>
        <p className="text-dim text-sm mt-1">
          Configure seu processo seletivo ou competicao
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i <= step;
          return (
            <div key={s.label} className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    active ? "bg-accent" : "bg-bg-elevated"
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Icon
                  size={12}
                  className={`transition-colors ${
                    active ? "text-accent" : "text-dim/40"
                  }`}
                />
                <span
                  className={`text-[11px] font-medium transition-colors ${
                    active ? "text-accent" : "text-dim/40"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Basic Info ── */}
      {step === 0 && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-surface/80 backdrop-blur-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <FileText size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-cream">Informacoes Basicas</h3>
              <p className="text-xs text-dim">Nome, tipo e prazo da avaliacao</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Nome da avaliacao"
              placeholder="PS Liga MF 2026.1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Textarea
              label="Descricao (opcional)"
              placeholder="Processo seletivo da Liga de Mercado Financeiro..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              label="Prazo para submissao"
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <Input
              label="Senha de administrador"
              type="password"
              placeholder="Para proteger o acesso ao painel"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Template Selection ── */}
      {step === 1 && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-surface/80 backdrop-blur-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Sparkles size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-cream">Template de Avaliacao</h3>
              <p className="text-xs text-dim">
                Escolha um template pre-configurado. Voce pode personalizar depois.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {Object.entries(templates).map(([key, tmpl]) => {
              const isSelected = form.type === key;
              const phaseCount = tmpl.phases.length;
              const sectionCount = tmpl.phases.reduce(
                (acc, p) => acc + p.sections.length,
                0
              );
              const criteriaCount = tmpl.phases.reduce(
                (acc, p) =>
                  acc +
                  p.sections.reduce((a, s) => a + s.criteria.length, 0),
                0
              );

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, type: key })}
                  className={`group relative p-4 rounded-xl border text-left transition-all duration-200 ${
                    isSelected
                      ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20"
                      : "border-[var(--border-color)] bg-bg-card hover:border-accent/20 hover:bg-bg-elevated/50"
                  }`}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                      </div>
                    </div>
                  )}

                  <div className="font-medium text-cream text-sm">
                    {tmpl.name}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-dim">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-elevated">
                      {phaseCount} fase{phaseCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-dim/30">/</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-elevated">
                      {sectionCount} secoes
                    </span>
                    <span className="text-dim/30">/</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-elevated">
                      {criteriaCount} criterios
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Review Template Details ── */}
      {step === 2 && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-surface/80 backdrop-blur-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Settings size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-cream">Configuracoes do Template</h3>
              <p className="text-xs text-dim">
                Revise os criterios e pesos. Edicao detalhada disponivel apos criacao.
              </p>
            </div>
          </div>

          {/* Phases */}
          <div className="space-y-5">
            {selectedTemplate.phases.map((phase, pi) => (
              <div key={pi} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-accent">{phase.name}</h4>
                  <span className="text-[11px] font-medium text-dim px-2 py-0.5 rounded-md bg-bg-elevated">
                    {(phase.weight * 100).toFixed(0)}%
                  </span>
                </div>
                {phase.sections.map((section, si) => (
                  <div
                    key={si}
                    className="pl-4 border-l-2 border-[var(--border-color)] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-cream/90">
                        {section.name}
                      </span>
                      <span className="text-[10px] font-medium text-dim px-1.5 py-0.5 rounded bg-bg-elevated">
                        {(section.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[11px] text-dim leading-relaxed">
                      {section.description}
                    </p>
                    <div className="space-y-0.5">
                      {section.criteria.map((c, ci) => (
                        <div
                          key={ci}
                          className="text-[11px] text-dim/70 pl-3 flex items-center gap-1.5"
                        >
                          <div className="w-1 h-1 rounded-full bg-dim/30 shrink-0" />
                          {c.name}
                          <span className="text-dim/40">
                            ({(c.weight * 100).toFixed(0)}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Cutoffs */}
          <div className="pt-4 border-t border-[var(--border-color)]">
            <h4 className="text-sm font-semibold text-cream mb-3">Classificacoes</h4>
            <div className="space-y-2">
              {selectedTemplate.cutoffs.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-bg-elevated/50"
                >
                  <span className="text-cream/90 text-sm">{c.label}</span>
                  <span className="text-[11px] text-dim font-mono">
                    &ge; {c.minScore} &mdash; {c.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hybrid */}
          <div className="pt-4 border-t border-[var(--border-color)]">
            <h4 className="text-sm font-semibold text-cream mb-3">Avaliacao Hibrida</h4>
            <div className="rounded-xl bg-bg-elevated p-4 space-y-1.5 font-mono text-[12px]">
              <p className="text-cream/80">
                Score Final = <span className="text-accent">(IA x 55%)</span> +{" "}
                <span className="text-sage">(Banca x 45%)</span>
              </p>
              <p className="text-dim/60 font-sans text-[11px]">
                Divergencia &le; 1.5: OK &middot; 1.5-2.5: Revisar &middot; &gt; 2.5: Divergente
              </p>
            </div>
          </div>

          {/* Instructions */}
          <Textarea
            label="Instrucoes para candidatos (opcional)"
            placeholder="Instrucoes especificas que os candidatos verao ao acessar o case..."
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          />
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 3 && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-surface/80 backdrop-blur-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <ClipboardCheck size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-cream">Confirmar Criacao</h3>
              <p className="text-xs text-dim">Revise os dados antes de criar</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Nome", value: form.name || "\u2014" },
              { label: "Tipo", value: selectedTemplate.name },
              {
                label: "Prazo",
                value: form.deadline
                  ? new Date(form.deadline).toLocaleDateString("pt-BR")
                  : "Sem prazo",
              },
              {
                label: "Fases",
                value: selectedTemplate.phases.map((p) => p.name).join(" + "),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-bg-elevated p-3 space-y-1"
              >
                <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-dim">
                  {item.label}
                </span>
                <p className="text-sm font-medium text-cream">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-bg-card p-4">
            <p className="text-[12px] text-dim leading-relaxed">
              Apos criar, voce podera importar candidatos, sortear equipes e
              fazer upload do case. Todas as configuracoes podem ser editadas posteriormente.
            </p>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : router.back())}
          className="h-10 px-4 rounded-xl border border-[var(--border-color)] text-sm text-cream hover:border-accent/30 hover:bg-bg-elevated transition-all flex items-center gap-2"
        >
          <ChevronLeft size={14} className="text-dim" />
          {step > 0 ? "Voltar" : "Cancelar"}
        </button>

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={step === 0 && (!form.name || !form.password)}
          >
            Proximo
            <ArrowRight size={14} />
          </Button>
        ) : (
          <Button onClick={handleSubmit} isLoading={isLoading}>
            Criar Avaliacao
            <Sparkles size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
