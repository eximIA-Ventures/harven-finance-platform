"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  UserMinus,
  Users,
  Search,
  Check,
  X,
  ChevronRight,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Participant {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  completedAt: string | null;
  currentStage: string | null;
  currentStageOrder: number;
  progress: number;
  submittedCount: number;
  approvedCount: number;
  totalTasks: number;
  requiredTasks: number;
}

interface StageInfo {
  id: string;
  name: string;
  sortOrder: number;
}

interface InstanceInfo {
  id: string;
  name: string;
  status: string;
  journeyId: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const journeyId = params.journeyId as string;

  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState<InstanceInfo | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stages, setStages] = useState<StageInfo[]>([]);

  // Add participant modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);

  // Find the active instance for this journey
  const findInstance = useCallback(async () => {
    try {
      const res = await fetch("/api/journey-instances");
      if (!res.ok) return;
      const instances = await res.json();
      const active = instances.find(
        (i: InstanceInfo & { journeyId: string }) =>
          i.journeyId === journeyId && i.status === "active"
      );
      if (active) {
        setInstance(active);
        return active.id;
      }
    } catch { /* silent */ }
    return null;
  }, [journeyId]);

  const fetchParticipants = useCallback(async (instanceId: string) => {
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}/participants`);
      if (res.ok) {
        const data = await res.json();
        setInstance(data.instance);
        setParticipants(data.participants);
        setStages(data.stages);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    findInstance().then((id) => {
      if (id) fetchParticipants(id);
      else setLoading(false);
    });
  }, [findInstance, fetchParticipants]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch { /* silent */ }
    finally { setLoadingMembers(false); }
  };

  const handleOpenAdd = () => {
    setShowAddModal(true);
    setSelectedIds(new Set());
    setSearchTerm("");
    fetchMembers();
  };

  const handleAddParticipants = async () => {
    if (!instance || selectedIds.size === 0) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/journey-instances/${instance.id}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_ids: Array.from(selectedIds) }),
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchParticipants(instance.id);
      }
    } catch { /* silent */ }
    finally { setAdding(false); }
  };

  const handleRemove = async (participantId: string, name: string) => {
    if (!instance) return;
    if (!confirm(`Remover ${name} da capacitacao?`)) return;
    try {
      await fetch(`/api/journey-instances/${instance.id}/participants?participantId=${participantId}`, {
        method: "DELETE",
      });
      fetchParticipants(instance.id);
    } catch { /* silent */ }
  };

  const existingUserIds = new Set(participants.map((p) => p.userId));
  const filteredMembers = members.filter((m) => {
    if (existingUserIds.has(m.id)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="ml-2 text-sm text-dim">Carregando participantes...</span>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <button onClick={() => router.push(`/admin/${evalId}/journeys/${journeyId}`)} className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="text-center py-16">
          <Users className="w-10 h-10 text-dim/30 mx-auto mb-3" />
          <p className="text-sm text-dim">Nenhuma turma ativa.</p>
          <p className="text-xs text-dim/60 mt-1">Crie uma turma primeiro para gerenciar participantes.</p>
          <button
            onClick={() => router.push(`/admin/${evalId}/journeys/${journeyId}/start`)}
            className="mt-4 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
          >
            Criar Turma
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back */}
      <button onClick={() => router.push(`/admin/${evalId}/journeys/${journeyId}`)} className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para jornada
      </button>

      {/* Header */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif text-cream">Participantes</h1>
            <div className="flex items-center gap-4 text-xs text-dim">
              <span>{instance.name}</span>
              <span>{participants.length} participante{participants.length !== 1 ? "s" : ""}</span>
              <span>{stages.length} etapa{stages.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {/* Participants table */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_120px_100px_80px_60px] gap-3 px-6 py-3 border-b border-[var(--border-color)] text-[10px] uppercase tracking-wider text-dim">
          <span>Participante</span>
          <span>Etapa atual</span>
          <span>Progresso</span>
          <span>Tarefas</span>
          <span></span>
        </div>

        {participants.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="w-8 h-8 text-dim/30 mx-auto mb-2" />
            <p className="text-sm text-dim">Nenhum participante.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {participants
              .sort((a, b) => b.progress - a.progress)
              .map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_120px_100px_80px_60px] gap-3 px-6 py-3 items-center hover:bg-bg-elevated/30 transition-colors">
                {/* Name + email */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent flex-shrink-0">
                    {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-cream font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-dim truncate">{p.email}</p>
                  </div>
                </div>

                {/* Current stage */}
                <div className="flex items-center gap-1.5">
                  {p.status === "completed" ? (
                    <Badge variant="success">Concluido</Badge>
                  ) : p.currentStage ? (
                    <span className="text-xs text-cream truncate">{p.currentStage}</span>
                  ) : (
                    <span className="text-xs text-dim">—</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.progress}%`,
                        backgroundColor: p.progress === 100 ? "#10B981" : "#C4A882",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-dim w-8 text-right">{p.progress}%</span>
                </div>

                {/* Task count */}
                <span className="text-xs text-dim">
                  {p.approvedCount}/{p.totalTasks}
                </span>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(p.id, p.name)}
                  className="p-1.5 rounded-lg text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors justify-self-end"
                  title="Remover participante"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[6px]" onClick={() => setShowAddModal(false)} style={{ animation: "modal-fade 0.2s ease-out" }} />
          <div className="relative z-10 w-full max-w-md max-h-[70vh] overflow-hidden" style={{ animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)] flex flex-col max-h-[70vh]">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-semibold text-cream">Adicionar Participantes</h2>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="px-6 py-3 border-b border-[var(--border-color)] flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full pl-9 pr-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                {selectedIds.size > 0 && (
                  <p className="text-xs text-accent mt-2">{selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}</p>
                )}
              </div>

              {/* Member list */}
              <div className="flex-1 overflow-y-auto">
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin text-dim" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="px-6 py-8 text-center text-xs text-dim">
                    {searchTerm ? "Nenhum membro encontrado." : "Todos os membros ja participam."}
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-color)]">
                    {filteredMembers.map((m) => {
                      const isSelected = selectedIds.has(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(m.id)) next.delete(m.id);
                              else next.add(m.id);
                              return next;
                            });
                          }}
                          className="w-full flex items-center gap-3 px-6 py-3 hover:bg-bg-elevated/50 transition-colors text-left"
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? "bg-accent text-white"
                              : "border border-[var(--border-color)]"
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-cream truncate">{m.name}</p>
                            <p className="text-[10px] text-dim truncate">{m.email}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 flex-shrink-0">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-dim hover:text-cream transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleAddParticipants}
                  disabled={selectedIds.size === 0 || adding}
                  className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  Adicionar ({selectedIds.size})
                </button>
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes modal-fade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes modal-scale { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
