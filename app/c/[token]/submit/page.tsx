"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SubmitPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [candidateData, setCandidateData] = useState<Record<string, unknown> | null>(null);
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [aiUsage, setAiUsage] = useState("none");
  const [aiDescription, setAiDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/candidate/${token}`)
      .then((r) => r.json())
      .then(setCandidateData)
      .catch(() => {});
  }, [token]);

  function handleFileUpload(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setRawText(reader.result as string);
    };
    reader.readAsText(file);
  }

  async function handleSubmit() {
    if (!candidateData) return;
    setIsLoading(true);
    try {
      const candidate = candidateData.candidate as Record<string, string>;
      const phases = candidateData.phases as Array<Record<string, string>>;
      const casePhase = phases.find((p) => p.slug === "case");

      await fetch(`/api/candidate/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: candidate.id,
          teamId: candidate.teamId,
          phaseId: casePhase?.id,
          rawText,
          fileName,
          aiUsage,
          aiUsageDescription: aiDescription,
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
            
            <h3 className="text-xl font-semibold text-success">Case enviado!</h3>
            <p className="text-text-secondary mt-2">
              Seu arquivo foi recebido com sucesso. Você será notificado quando
              os resultados estiverem disponíveis.
            </p>
            <Button
              variant="secondary"
              className="mt-6"
              onClick={() => router.push(`/c/${token}`)}
            >
              Voltar ao painel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <div>
          <h2 className="text-2xl font-bold">Enviar Case</h2>
          <p className="text-text-secondary mt-1">
            Faça upload do seu relatório ou cole o texto diretamente
          </p>
        </div>

        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Seu Relatório</CardTitle>
            <CardDescription>
              Aceita PDF, DOCX ou TXT. Você também pode colar o texto diretamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
              <div className="text-center">
                {fileName ? (
                  <>
                    <p className="font-medium text-accent">{fileName}</p>
                    <p className="text-xs text-text-muted mt-1">
                      Clique para trocar
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-text-secondary">
                      📎 Arraste ou clique para upload
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      PDF, DOCX ou TXT
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.doc"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </label>

            <div className="relative">
              <div className="absolute inset-x-0 top-0 flex justify-center -translate-y-1/2">
                <span className="bg-bg-card px-3 text-xs text-text-muted">
                  ou cole o texto
                </span>
              </div>
            </div>

            <Textarea
              placeholder="Cole o conteúdo do seu relatório aqui..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        {/* AI Usage Declaration */}
        <Card>
          <CardHeader>
            <CardTitle>Uso de Inteligência Artificial</CardTitle>
            <CardDescription>
              Não há penalidade. Queremos apenas entender como você trabalhou.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { value: "none", label: "Não utilizei IA" },
              { value: "research", label: "Sim, para pesquisa e organização" },
              { value: "writing", label: "Sim, para auxílio na escrita" },
              { value: "extensive", label: "Sim, extensivamente" },
            ].map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  aiUsage === opt.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <input
                  type="radio"
                  name="aiUsage"
                  value={opt.value}
                  checked={aiUsage === opt.value}
                  onChange={(e) => setAiUsage(e.target.value)}
                  className="w-4 h-4 text-accent"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}

            {aiUsage !== "none" && (
              <Textarea
                label="Descreva brevemente como utilizou (opcional)"
                placeholder="Ex: Usei o ChatGPT para pesquisar conceitos sobre E2G e organizar dados do setor..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => router.push(`/c/${token}`)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!rawText.trim()}
            size="lg"
          >
            Enviar Case
          </Button>
        </div>
      </main>
    </div>
  );
}
