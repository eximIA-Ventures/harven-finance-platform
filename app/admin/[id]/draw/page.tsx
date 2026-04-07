"use client";
import { PSHeader } from "@/components/ps-header";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Team { id: string; number: number; }
interface Candidate { id: string; name: string; email: string; group: string | null; teamId: string | null; }

export default function DrawPage() {
  const { id } = useParams<{ id: string }>();
  const [mode, setMode] = useState<"teams" | "people">("teams");
  const [teamCount, setTeamCount] = useState(3);
  const [peoplePerTeam, setPeoplePerTeam] = useState(3);
  const [noSameGroup, setNoSameGroup] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [drawSeed, setDrawSeed] = useState<string | null>(null);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const res = await fetch(`/api/evaluations/${id}/data`);
    const data = await res.json();
    setTeams(data.teams || []);
    setCandidates(data.candidates || []);
    if (data.teams?.length > 0) setDrawSeed(data.teams[0].drawSeed);
  }

  const totalCandidates = candidates.length;
  const effectiveTeamCount = mode === "teams" ? teamCount : Math.ceil(totalCandidates / peoplePerTeam);
  const effectivePeoplePerTeam = mode === "people" ? peoplePerTeam : Math.ceil(totalCandidates / teamCount);

  async function handleDraw() {
    setIsLoading(true);
    const res = await fetch(`/api/evaluations/${id}/draw`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamCount: effectiveTeamCount, constraints: { noSameGroup } }),
    });
    const data = await res.json();
    setDrawSeed(data.seed);
    await loadData();
    setIsLoading(false);
  }

  const candidatesByTeam = teams.map((t) => ({ ...t, members: candidates.filter((c) => c.teamId === t.id) }));

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl">
      <div>
        <PSHeader evaluationId={id} />

      <h2 className="text-2xl font-serif mt-6">Sorteio de Equipes</h2>
        <p className="text-dim text-sm mt-1">{totalCandidates} candidatos disponíveis</p>
      </div>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Sorteio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <button onClick={() => setMode("teams")} className={`flex-1 p-3 rounded-lg border text-center text-sm transition-colors ${mode === "teams" ? "border-accent bg-accent/10 text-accent" : "border-[var(--border-color)] text-dim hover:border-accent/20"}`}>
              Por número de equipes
            </button>
            <button onClick={() => setMode("people")} className={`flex-1 p-3 rounded-lg border text-center text-sm transition-colors ${mode === "people" ? "border-accent bg-accent/10 text-accent" : "border-[var(--border-color)] text-dim hover:border-accent/20"}`}>
              Por pessoas por equipe
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {mode === "teams" ? (
              <Input label="Número de equipes" type="number" min={2} max={Math.ceil(totalCandidates / 2)} value={teamCount} onChange={(e) => setTeamCount(parseInt(e.target.value) || 2)} />
            ) : (
              <Input label="Pessoas por equipe" type="number" min={2} max={totalCandidates} value={peoplePerTeam} onChange={(e) => setPeoplePerTeam(parseInt(e.target.value) || 2)} />
            )}
            <div className="flex items-end pb-2">
              <p className="text-sm text-dim">
                = <span className="text-cream font-medium">{effectiveTeamCount} equipes</span> de <span className="text-cream font-medium">~{effectivePeoplePerTeam} pessoas</span>
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={noSameGroup} onChange={(e) => setNoSameGroup(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-bg-elevated text-accent focus:ring-accent" />
            <span className="text-sm text-cream">Não repetir mesma turma/curso na mesma equipe</span>
          </label>

          <Button onClick={handleDraw} isLoading={isLoading} size="lg" className="w-full">
             Sortear Equipes
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {candidatesByTeam.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Sorteio</CardTitle>
            <CardDescription>
              Seed: <code className="font-mono text-accent">{drawSeed}</code> · {candidatesByTeam.length} equipes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {candidatesByTeam.map((team) => (
                <div key={team.id} className="p-4 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card space-y-2">
                  <h4 className="font-semibold text-accent">Equipe {team.number}</h4>
                  <div className="space-y-1">
                    {team.members.map((m) => (
                      <div key={m.id} className="text-sm flex items-center gap-2">
                        <span className="text-cream">{m.name}</span>
                        {m.group && <span className="text-[10px] text-dim">{m.group}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" onClick={handleDraw}> Ressortear</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
