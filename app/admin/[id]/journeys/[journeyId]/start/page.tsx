"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Users,
  UserPlus,
  X,
  Check,
  Route,
  Rocket,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MemberOption {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  memberStatus: string | null;
}

interface JourneyMeta {
  id: string;
  name: string;
  journeyType: string | null;
  color: string | null;
  estimatedDays: number | null;
  stages: { id: string; name: string; tasks: { id: string }[] }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

const ROLE_OPTIONS = [
  { key: "presidente", label: "Presidentes" },
  { key: "vice-presidente", label: "Vice-Presidentes" },
  { key: "trainee", label: "Trainees" },
];

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function StartJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const journeyId = params.journeyId as string;

  const [journey, setJourney] = useState<JourneyMeta | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEndDate, setShowEndDate] = useState(false);
  const [mentorId, setMentorId] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");

  // Fetch journey + members
  const fetchData = useCallback(async () => {
    try {
      const [jRes, mRes] = await Promise.all([
        fetch(`/api/journeys/${journeyId}`),
        fetch("/api/members"),
      ]);
      if (jRes.ok) {
        const j = await jRes.json();
        setJourney(j);
        setName(j.name);
      }
      if (mRes.ok) setMembers(await mRes.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Participant selection
  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const inviteByRole = (role: string) => {
    const roleMembers = members.filter((m) => m.memberStatus === role);
    const newIds = new Set(participantIds);
    roleMembers.forEach((m) => newIds.add(m.id));
    setParticipantIds(Array.from(newIds));
  };

  const inviteAll = () => {
    setParticipantIds(members.map((m) => m.id));
  };

  const filteredMembers = members.filter(
    (m) =>
      !memberSearch ||
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Submit
  const handleSubmit = async () => {
    if (!name || !startDate || participantIds.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/journey-instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journey_id: journeyId,
          name,
          start_date: startDate,
          end_date: showEndDate && endDate ? endDate : null,
          mentor_id: mentorId || null,
          participant_ids: participantIds,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(
          `/admin/${evalId}/journeys/${journeyId}/instances/${data.id}`
        );
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="ml-2 text-sm text-dim">Carregando...</span>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="text-center py-20">
        <p className="text-dim">Jornada nao encontrada.</p>
        <button
          onClick={() => router.push(`/admin/${evalId}/journeys`)}
          className="mt-4 text-accent hover:underline text-sm"
        >
          Voltar para jornadas
        </button>
      </div>
    );
  }

  const totalTasks = journey.stages.reduce((a, s) => a + s.tasks.length, 0);

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      {/* Back link */}
      <button
        onClick={() =>
          router.push(`/admin/${evalId}/journeys/${journeyId}`)
        }
        className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao builder
      </button>

      {/* Header */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: journey.color || "#C4A882" }}
          />
          <h1 className="text-2xl font-serif text-cream">Iniciar Jornada</h1>
        </div>
        <p className="text-sm text-dim ml-6">
          {journey.name} &middot; {journey.stages.length} etapa
          {journey.stages.length !== 1 ? "s" : ""} &middot; {totalTasks} tarefa
          {totalTasks !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Instance name */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-wider text-dim">
            Nome da instancia
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Turma 2026.1 — Investment Thesis"
            className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40"
          />
        </div>

        {/* Dates */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                {showEndDate ? "Inicio" : "Data de inicio"}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {showEndDate ? (
            <div className="flex items-center gap-3 ml-7">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                  Prazo final
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                onClick={() => {
                  setShowEndDate(false);
                  setEndDate("");
                }}
                className="p-1.5 text-dim hover:text-red-400 transition-colors mt-4"
                title="Remover prazo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowEndDate(true)}
              className="ml-7 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              + Adicionar prazo
            </button>
          )}
        </div>

        {/* Mentor */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Route className="w-4 h-4 text-accent flex-shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                Mentor responsavel
              </label>
              <select
                value={mentorId}
                onChange={(e) => setMentorId(e.target.value)}
                className={inputCls}
              >
                <option value="">Selecionar mentor...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.memberStatus || "membro"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-cream">Participantes</h3>
          </div>
          {participantIds.length > 0 && (
            <Badge variant="accent">{participantIds.length} selecionado{participantIds.length !== 1 ? "s" : ""}</Badge>
          )}
        </div>

        {/* Quick invite by role */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-dim">
            Selecao rapida
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={inviteAll}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)] hover:text-cream hover:border-accent/20 transition-all"
            >
              Todos
            </button>
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.key}
                onClick={() => inviteByRole(r.key)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)] hover:text-cream hover:border-accent/20 transition-all"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-accent" />
          <input
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Buscar membro..."
            className={`${inputCls} text-xs`}
          />
        </div>

        {/* Selected pills */}
        {participantIds.length > 0 && (
          <div>
            <span className="text-[10px] text-dim">
              {participantIds.length} participante{participantIds.length !== 1 ? "s" : ""}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {participantIds.map((uid) => {
                const m = members.find((x) => x.id === uid);
                return (
                  <span
                    key={uid}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-medium"
                  >
                    {m?.name || uid}
                    <button
                      onClick={() => toggleParticipant(uid)}
                      className="hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-bg-elevated divide-y divide-[var(--border-color)]">
          {filteredMembers.length === 0 ? (
            <p className="text-xs text-dim text-center py-3">
              Nenhum membro encontrado
            </p>
          ) : (
            filteredMembers.map((m) => {
              const selected = participantIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleParticipant(m.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    selected ? "bg-accent/5" : "hover:bg-bg-card"
                  }`}
                >
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt=""
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent font-medium">
                      {m.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-cream block truncate">
                      {m.name}
                    </span>
                    <span className="text-[10px] text-dim block truncate">
                      {m.memberStatus || "membro"} &middot; {m.email}
                    </span>
                  </div>
                  {selected && (
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          onClick={() =>
            router.push(`/admin/${evalId}/journeys/${journeyId}`)
          }
          className="px-4 py-2 text-sm text-dim hover:text-cream transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name || !startDate || participantIds.length === 0 || saving}
          className="px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          Iniciar Jornada
        </button>
      </div>
    </div>
  );
}
