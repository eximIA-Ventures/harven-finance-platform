"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Team {
  id: string;
  number: number;
}

interface AiResult {
  suggestedQuestions: string;
  profile: string;
  finalScore: number;
}

export default function PitchPage() {
  const { id } = useParams<{ id: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    fetch(`/api/evaluations/${id}/data`)
      .then((r) => r.json())
      .then((d) => setTeams(d.teams || []))
      .catch(() => {});
  }, [id]);

  async function loadQuestions(teamId: string) {
    setSelectedTeam(teamId);
    try {
      const res = await fetch(`/api/evaluations/${id}/pitch-data?teamId=${teamId}`);
      const data = await res.json();
      setQuestions(data.suggestedQuestions || []);
    } catch {
      setQuestions([]);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      <div>
        <h2 className="text-2xl font-serif">Fase Pitch</h2>
        <p className="text-dim text-sm mt-1">
          Gerencie apresentações e avaliações de pitch
        </p>
      </div>

      {/* Team Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Equipe</CardTitle>
          <CardDescription>Escolha a equipe para ver perguntas sugeridas e registrar o pitch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => loadQuestions(team.id)}
                className={`p-3 rounded-lg border text-center transition-colors ${
                  selectedTeam === team.id
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-[var(--border-color)] hover:border-accent/20 text-cream"
                }`}
              >
                <span className="text-sm font-medium">Equipe {team.number}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTeam && (
        <>
          {/* Suggested Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Sugeridas pela IA</CardTitle>
              <CardDescription>
                Baseadas na análise do case desta equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length > 0 ? (
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-bg-surface rounded-lg border border-white/5">
                      <span className="text-accent font-mono text-sm font-bold">{i + 1}.</span>
                      <p className="text-sm text-cream-dim">{q}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dim text-sm">
                  Nenhuma pergunta disponível. Execute a avaliação por IA primeiro para gerar perguntas personalizadas.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Transcript Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Transcrição do Pitch</CardTitle>
              <CardDescription>
                Cole a transcrição da apresentação (via Plaud, Whisper, ou manual)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors text-center">
                  <div>
                    <span className="text-lg block mb-1"></span>
                    <span className="text-xs text-dim">Upload Vídeo</span>
                  </div>
                  <input type="file" accept="video/*" className="hidden" />
                </label>
                <label className="flex items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors text-center">
                  <div>
                    <span className="text-lg block mb-1"></span>
                    <span className="text-xs text-dim">Upload Áudio</span>
                  </div>
                  <input type="file" accept="audio/*" className="hidden" />
                </label>
                <label className="flex items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent/30 transition-colors text-center">
                  <div>
                    <span className="text-lg block mb-1"></span>
                    <span className="text-xs text-dim">Upload TXT</span>
                  </div>
                  <input type="file" accept=".txt,.doc,.docx" className="hidden" />
                </label>
              </div>

              <Textarea
                label="Ou cole a transcrição diretamente"
                placeholder="[Apresentação - 00:00] Boa tarde, nosso grupo analisou o case da Raízen..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[200px]"
              />

              <Button disabled={!transcript.trim()} size="lg" className="w-full">
                 Avaliar Pitch com IA
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
