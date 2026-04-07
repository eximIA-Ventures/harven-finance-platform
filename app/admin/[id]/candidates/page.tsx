"use client";
import { PSHeader } from "@/components/ps-header";

import { useState, useEffect, useMemo, Fragment, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReviewerDetail { name: string; score: number; recommendation: string; }
interface Candidate {
  id: string; name: string; email: string; group: string | null; teamId: string | null; status: string;
  teamNumber: number | null; aiScore: number | null; humanScore: number | null; finalScore: number | null;
  classification: string | null; divergence: number | null; humanReviewCount: number; reviewerDetails: ReviewerDetail[];
}
interface Team { id: string; number: number; }

type SortKey = "name" | "email" | "group" | "team" | "status";
type SortDir = "asc" | "desc";
type FilterDecision = "all" | "pending" | "approved" | "rejected";

const inputCls = "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

export default function CandidatesPage() {
  const { id } = useParams<{ id: string }>();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [rawData, setRawData] = useState("");
  const [defaultPw, setDefaultPw] = useState("liga2026");
  const [parsed, setParsed] = useState<Array<{ name: string; email: string; group: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filterDecision, setFilterDecision] = useState<FilterDecision>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    const [dataRes, fullRes] = await Promise.all([
      fetch(`/api/evaluations/${id}/data`),
      fetch(`/api/evaluations/${id}/candidates-full`),
    ]);
    const data = await dataRes.json();
    const full = await fullRes.json();
    setCandidates(full.candidates || data.candidates || []);
    setTeams(data.teams || []);
  }

  function parseCSV() {
    const lines = rawData.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    const sep = lines[0]?.includes("\t") ? "\t" : lines[0]?.includes(";") ? ";" : ",";
    const startIdx = lines[0]?.toLowerCase().includes("nome") ? 1 : 0;
    const rows = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length >= 2) rows.push({ name: cols[0], email: cols[1], group: cols[2] || "" });
    }
    setParsed(rows);
  }

  async function handleImport() {
    setIsLoading(true);
    await fetch(`/api/evaluations/${id}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates: parsed, defaultPassword: defaultPw }),
    });
    setIsLoading(false);
    closeImportModal();
    loadData();
  }

  function closeImportModal() {
    setShowImport(false);
    setRawData("");
    setParsed([]);
  }

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") closeImportModal();
  }, []);

  useEffect(() => {
    if (showImport) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [showImport, handleEsc]);

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    let list = [...candidates];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (filterDecision !== "all") {
      list = list.filter((c) => (decisions[c.id] || "pending") === filterDecision);
    }
    if (filterTeam !== "all") {
      list = list.filter((c) => c.teamId === filterTeam);
    }
    list.sort((a, b) => {
      let va = "", vb = "";
      if (sortKey === "name") { va = a.name; vb = b.name; }
      else if (sortKey === "email") { va = a.email; vb = b.email; }
      else if (sortKey === "group") { va = a.group || ""; vb = b.group || ""; }
      else if (sortKey === "team") { va = String(teamMap.get(a.teamId || "")?.number || 0); vb = String(teamMap.get(b.teamId || "")?.number || 0); }
      else if (sortKey === "status") { va = a.status; vb = b.status; }
      return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [candidates, search, filterDecision, filterTeam, sortKey, sortDir, decisions, teamMap]);

  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const approved = Object.values(decisions).filter((d) => d === "approved").length;
  const rejected = Object.values(decisions).filter((d) => d === "rejected").length;

  function exportCSV() {
    const header = "#,Candidato,Email,Turma,Equipe,Status,Nota IA,Nota Banca,Final,Veredito,Decisao\n";
    const rows = filtered.map((c, i) => {
      const team = c.teamId ? teamMap.get(c.teamId) : null;
      const d = decisions[c.id] || "pending";
      return `${i+1},"${c.name}","${c.email}","${c.group || ""}",${team?.number || ""},${c.status},—,—,—,Aguardando,${d}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "candidatos.csv"; a.click();
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <span className="text-dim/30 ml-1">↕</span>;
    return <span className="text-accent ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="space-y-5 animate-fade-in-up max-w-[1400px]">
      <PSHeader evaluationId={id} />

      <div className="flex items-center justify-between mt-6">
        <div>
          <h2 className="text-2xl font-serif text-cream">Central de Candidatos</h2>
          <p className="text-dim text-sm mt-1">
            {candidates.length} candidatos
            {approved > 0 && <span className="text-sage"> -- {approved} aprovados</span>}
            {rejected > 0 && <span className="text-danger"> -- {rejected} reprovados</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {candidates.length > 0 && (
            <Button onClick={exportCSV} variant="secondary" size="sm">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
              CSV
            </Button>
          )}
          <Button onClick={() => setShowImport(true)} variant="primary" size="sm">
            + Importar
          </Button>
        </div>
      </div>

      {/* ── Import Modal ── */}
      {showImport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-[6px] animate-[modal-fade_0.2s_ease-out]"
          onClick={(e) => { if (e.target === e.currentTarget) closeImportModal(); }}
        >
          <div className="relative w-full max-w-lg mx-4 bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)] flex flex-col max-h-[85vh] animate-[modal-scale_0.2s_ease-out]">
            {/* Sticky header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-cream">Importar Candidatos</h3>
              </div>
              <button
                onClick={closeImportModal}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-dim hover:text-cream hover:bg-bg-elevated transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {/* CSV textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-cream flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
                  </svg>
                  Dados CSV
                </label>
                <textarea
                  placeholder={`João Silva, joao@email.com, ADM 2024\nMaria Lima, maria@email.com, AGRO 2024`}
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  rows={5}
                  className={`${inputCls} min-h-[120px] font-mono text-xs resize-y`}
                />
                <p className="text-[10px] text-dim/60">
                  Formato: Nome, Email, Turma (separado por virgula, tab ou ponto-e-virgula)
                </p>
              </div>

              {/* Default password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-cream flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Senha padrao
                </label>
                <input
                  type="text"
                  value={defaultPw}
                  onChange={(e) => setDefaultPw(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Parse preview */}
              {parsed.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-bg-surface rounded-xl border border-[var(--border-color)]">
                  <div className="w-7 h-7 rounded-lg bg-sage/15 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </div>
                  <span className="text-sm text-cream font-medium">{parsed.length} candidatos prontos para importar</span>
                </div>
              )}
            </div>

            {/* Sticky footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] shrink-0">
              <Button variant="secondary" size="sm" onClick={closeImportModal}>
                Cancelar
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={parseCSV} disabled={!rawData.trim()}>
                  Pre-visualizar
                </Button>
                {parsed.length > 0 && (
                  <Button onClick={handleImport} isLoading={isLoading} size="sm">
                    Importar {parsed.length}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {candidates.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-64 !py-1.5 text-xs`}
          />

          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value as FilterDecision)}
            className="h-8 px-3 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-xs text-cream focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          >
            <option value="all">Todas decisoes</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Reprovados</option>
          </select>

          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="h-8 px-3 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-xs text-cream focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
          >
            <option value="all">Todas equipes</option>
            {teams.map((t) => <option key={t.id} value={t.id}>Equipe {t.number}</option>)}
          </select>

          <span className="text-[10px] text-dim ml-auto">{filtered.length} de {candidates.length}</span>
        </div>
      )}

      {/* Table */}
      {candidates.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg-surface">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim w-8">#</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim cursor-pointer hover:text-cream" onClick={() => toggleSort("name")}>
                      Candidato <SortIcon column="name" />
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim cursor-pointer hover:text-cream" onClick={() => toggleSort("email")}>
                      Email <SortIcon column="email" />
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim cursor-pointer hover:text-cream" onClick={() => toggleSort("group")}>
                      Turma <SortIcon column="group" />
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim cursor-pointer hover:text-cream" onClick={() => toggleSort("team")}>
                      Equipe <SortIcon column="team" />
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim cursor-pointer hover:text-cream" onClick={() => toggleSort("status")}>
                      Status <SortIcon column="status" />
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">IA</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Banca</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Final</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Veredito</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">Decisao</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => {
                    const team = c.teamId ? teamMap.get(c.teamId) : null;
                    const decision = decisions[c.id] || "pending";
                    const isExpanded = expandedCandidate === c.id;
                    return (
                      <Fragment key={c.id}>
                        <tr className={`border-t border-[var(--border-color)] hover:bg-bg-surface transition-colors ${isExpanded ? "bg-bg-surface" : ""}`}>
                          <td className="px-3 py-2.5 text-dim font-mono text-[10px]">{i + 1}</td>
                          <td className="px-3 py-2.5">
                            <button onClick={() => setExpandedCandidate(isExpanded ? null : c.id)} className="text-left">
                              <span className="font-medium text-cream text-xs hover:text-accent transition-colors">{c.name}</span>
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-dim text-[10px]">{c.email}</td>
                          <td className="px-3 py-2.5 text-center text-dim text-[10px]">{c.group || "—"}</td>
                          <td className="px-3 py-2.5 text-center">
                            {c.teamNumber ? (
                              <a href={`/admin/${id}/evaluation/${c.teamId}`} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/10 text-accent text-[10px] font-mono font-bold hover:bg-accent/20 transition-colors">
                                {c.teamNumber}
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" /></svg>
                              </a>
                            ) : <span className="text-dim text-[10px]">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`w-2 h-2 rounded-full inline-block ${c.status !== "pending" ? "bg-sage" : "bg-dim/30"}`} />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {c.aiScore !== null ? (
                              <span className={`font-mono text-xs font-medium ${c.aiScore >= 7 ? "text-sage" : c.aiScore >= 5 ? "text-accent" : "text-danger"}`}>{c.aiScore.toFixed(1)}</span>
                            ) : <span className="text-dim text-[10px]">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {c.humanScore !== null ? (
                              <span className={`font-mono text-xs font-medium ${c.humanScore >= 7 ? "text-sage" : c.humanScore >= 5 ? "text-accent" : "text-danger"}`}>
                                {c.humanScore.toFixed(1)}
                                <span className="text-dim text-[8px] ml-0.5">({c.humanReviewCount})</span>
                              </span>
                            ) : <span className="text-dim text-[10px]">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {c.finalScore !== null ? (
                              <span className={`font-mono text-xs font-bold ${c.finalScore >= 7 ? "text-sage" : c.finalScore >= 5 ? "text-accent" : "text-danger"}`}>{c.finalScore.toFixed(2)}</span>
                            ) : <span className="text-dim text-[10px]">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {c.classification ? (
                              <Badge variant={c.classification === "Destaque" ? "success" : c.classification === "Aprovado" ? "success" : c.classification === "Borderline" ? "warning" : "danger"}>
                                {c.classification}
                              </Badge>
                            ) : (
                              <Badge variant="default">Aguardando</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setDecisions({ ...decisions, [c.id]: decision === "approved" ? "pending" : "approved" })}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                  decision === "approved"
                                    ? "bg-sage/20 text-sage ring-1 ring-sage/30"
                                    : "bg-bg-elevated text-dim/40 hover:bg-sage/10 hover:text-sage"
                                }`}
                                title="Aprovar"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              </button>
                              <button
                                onClick={() => setDecisions({ ...decisions, [c.id]: decision === "rejected" ? "pending" : "rejected" })}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                  decision === "rejected"
                                    ? "bg-danger/20 text-danger ring-1 ring-danger/30"
                                    : "bg-bg-elevated text-dim/40 hover:bg-danger/10 hover:text-danger"
                                }`}
                                title="Reprovar"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                              <button
                                onClick={() => setExpandedCandidate(isExpanded ? null : c.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-bg-elevated text-dim/40 hover:bg-bg-elevated hover:text-cream transition-all"
                                title="Ver detalhes"
                              >
                                <svg className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={11} className="px-0 py-0">
                              <div className="px-6 py-4 bg-bg-surface border-t border-[var(--border-color)]">
                                <div className="grid grid-cols-3 gap-4">
                                  {/* Avaliacao IA */}
                                  <div className="rounded-lg ring-1 ring-[var(--border-color)] bg-bg-card p-4">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Avaliacao IA</p>
                                    <p className={`text-2xl font-bold font-mono ${c.aiScore !== null ? (c.aiScore >= 7 ? "text-sage" : c.aiScore >= 5 ? "text-accent" : "text-danger") : "text-dim"}`}>
                                      {c.aiScore !== null ? c.aiScore.toFixed(1) : "—"}
                                    </p>
                                    <p className="text-[9px] text-dim mt-1">{c.aiScore !== null ? "Avaliacao concluida" : "Aguardando execucao"}</p>
                                  </div>

                                  {/* Avaliacao Banca */}
                                  <div className="rounded-lg ring-1 ring-[var(--border-color)] bg-bg-card p-4">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Avaliacao Banca</p>
                                    <p className={`text-2xl font-bold font-mono ${c.humanScore !== null ? (c.humanScore >= 7 ? "text-sage" : c.humanScore >= 5 ? "text-accent" : "text-danger") : "text-dim"}`}>
                                      {c.humanScore !== null ? c.humanScore.toFixed(1) : "—"}
                                    </p>
                                    {c.reviewerDetails.length > 0 ? (
                                      <div className="mt-3 space-y-1.5">
                                        {c.reviewerDetails.map((r, ri) => (
                                          <div key={ri} className="flex justify-between text-[10px]">
                                            <span className="text-cream">{r.name}</span>
                                            <span className={`font-mono font-medium ${r.score >= 7 ? "text-sage" : r.score >= 5 ? "text-accent" : "text-danger"}`}>{r.score.toFixed(1)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-[9px] text-dim mt-1">Nenhum avaliador completou</p>
                                    )}
                                  </div>

                                  {/* Score consolidado */}
                                  <div className="rounded-lg ring-1 ring-[var(--border-color)] bg-bg-card p-4">
                                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Score Final</p>
                                    <p className={`text-2xl font-bold font-mono ${c.finalScore !== null ? (c.finalScore >= 7 ? "text-sage" : c.finalScore >= 5 ? "text-accent" : "text-danger") : "text-dim"}`}>
                                      {c.finalScore !== null ? c.finalScore.toFixed(2) : "—"}
                                    </p>
                                    <p className="text-[9px] text-dim mt-1">(IA x 55%) + (Banca x 45%)</p>
                                    {c.divergence !== null && (
                                      <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                                        <p className={`text-[9px] ${c.divergence <= 1.5 ? "text-sage" : c.divergence <= 2.5 ? "text-warning" : "text-danger"}`}>
                                          Divergencia: {c.divergence.toFixed(1)}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {candidates.length === 0 && !showImport && (
        <div className="text-center py-16 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card">
          <div className="w-14 h-14 bg-accent/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-cream mb-2">Nenhum candidato</h3>
          <p className="text-dim text-sm mb-6">Importe do Google Forms</p>
          <Button onClick={() => setShowImport(true)}>Importar Candidatos</Button>
        </div>
      )}

      {/* Modal keyframes */}
      <style jsx global>{`
        @keyframes modal-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modal-scale {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
