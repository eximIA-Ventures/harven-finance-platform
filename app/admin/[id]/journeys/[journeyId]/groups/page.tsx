"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  Users,
  Calendar,
  Plus,
  ChevronDown,
  ChevronRight,
  Pause,
  Play,
  Archive,
  ExternalLink,
  BarChart3,
  Circle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface InstanceSummary {
  id: string;
  journeyId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  mentorId: string | null;
  createdAt: string;
  journeyName: string | null;
  journeyType: string | null;
  journeyColor: string | null;
  participantCount: number;
  totalTasks: number;
  approvedCount: number;
  progressPercent: number;
}

interface StageProgress {
  stageId: string;
  stageName: string;
  totalTasks: number;
  submitted: number;
  approved: number;
}

interface ParticipantDetail {
  id: string;
  userId: string;
  role: string;
  status: string;
  currentStageId: string | null;
  completedAt: string | null;
  joinedAt: string;
  userName: string | null;
  userAvatar: string | null;
  stageProgress: StageProgress[];
}

interface StageDetail {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  tasks: { id: string; name: string }[];
}

interface InstanceDetail {
  id: string;
  journeyId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  mentorId: string | null;
  journey: {
    id: string;
    name: string;
    journeyType: string | null;
    color: string | null;
  } | null;
  stages: StageDetail[];
  participants: ParticipantDetail[];
}

interface MemberInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  "case-competition": "Case Competition",
  "investment-thesis": "Investment Thesis",
  "trainee-onboarding": "Trainee Onboarding",
  "nucleus-project": "Nucleus Project",
  custom: "Custom",
};

const typeBadgeVariant: Record<
  string,
  "warning" | "info" | "success" | "accent" | "default"
> = {
  "case-competition": "warning",
  "investment-thesis": "info",
  "trainee-onboarding": "success",
  "nucleus-project": "accent",
  custom: "default",
};

const instanceStatusBadge: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "info" | "accent" | "default";
  }
> = {
  active: { label: "Em andamento", variant: "success" },
  completed: { label: "Concluida", variant: "accent" },
  paused: { label: "Pausada", variant: "warning" },
  archived: { label: "Arquivada", variant: "default" },
};

const participantStatusBadge: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "accent" | "default";
  }
> = {
  active: { label: "Ativo", variant: "success" },
  completed: { label: "Concluido", variant: "accent" },
  dropped: { label: "Desistiu", variant: "danger" },
};

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatarUrl,
  size = "sm",
}: {
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const initials = (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || ""}
        className={`${dim} rounded-full object-cover border border-[var(--border-color)]`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-accent/15 text-accent font-semibold flex items-center justify-center border border-accent/20`}
    >
      {initials}
    </div>
  );
}

// ─── Progress Bar ───────────────────────────────────────────────────────────

function ProgressBar({
  percent,
  size = "md",
}: {
  percent: number;
  size?: "sm" | "md";
}) {
  const h = size === "sm" ? "h-1.5" : "h-2";
  return (
    <div className={`w-full ${h} bg-bg-elevated rounded-full overflow-hidden`}>
      <div
        className={`${h} bg-accent rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}

// ─── Stage Pipeline Dots ────────────────────────────────────────────────────

function StagePipeline({
  stages,
  stageProgress,
}: {
  stages: StageDetail[];
  stageProgress?: StageProgress[];
}) {
  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, i) => {
        const progress = stageProgress?.find((sp) => sp.stageId === stage.id);
        let color = "bg-bg-elevated"; // not started
        if (progress) {
          if (
            progress.approved >= progress.totalTasks &&
            progress.totalTasks > 0
          ) {
            color = "bg-success"; // done
          } else if (progress.submitted > 0 || progress.approved > 0) {
            color = "bg-accent"; // in progress
          }
        }
        return (
          <div key={stage.id} className="flex items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${color} transition-colors`}
              title={`${stage.name}${progress ? ` (${progress.approved}/${progress.totalTasks})` : ""}`}
            />
            {i < stages.length - 1 && (
              <div className="w-2 h-px bg-[var(--border-color)]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Heatmap Grid ───────────────────────────────────────────────────────────

function CompletionHeatmap({
  stages,
  participants,
}: {
  stages: StageDetail[];
  participants: ParticipantDetail[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr>
            <th className="text-left text-dim font-normal py-1.5 pr-3 whitespace-nowrap">
              Participante
            </th>
            {stages.map((s) => (
              <th
                key={s.id}
                className="text-center text-dim font-normal py-1.5 px-1.5 whitespace-nowrap"
                title={s.name}
              >
                <span className="max-w-[60px] truncate inline-block">
                  {s.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map((p) => (
            <tr key={p.id}>
              <td className="py-1.5 pr-3">
                <div className="flex items-center gap-2">
                  <Avatar
                    name={p.userName}
                    avatarUrl={p.userAvatar}
                    size="sm"
                  />
                  <span className="text-cream truncate max-w-[120px]">
                    {p.userName || "Sem nome"}
                  </span>
                </div>
              </td>
              {stages.map((stage) => {
                const sp = p.stageProgress.find(
                  (s) => s.stageId === stage.id
                );
                let bg = "bg-bg-elevated"; // not started
                let label = "0/0";
                if (sp) {
                  label = `${sp.approved}/${sp.totalTasks}`;
                  if (
                    sp.approved >= sp.totalTasks &&
                    sp.totalTasks > 0
                  ) {
                    bg = "bg-success/20 border-success/30";
                  } else if (sp.submitted > 0 || sp.approved > 0) {
                    bg = "bg-accent/20 border-accent/30";
                  } else {
                    bg = "bg-bg-elevated border-[var(--border-color)]";
                  }
                }
                return (
                  <td key={stage.id} className="py-1.5 px-1.5">
                    <div
                      className={`w-full h-7 rounded-lg border ${bg} flex items-center justify-center text-[10px] text-dim`}
                      title={`${stage.name}: ${label}`}
                    >
                      {sp ? label : "-"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Instance Card ──────────────────────────────────────────────────────────

function InstanceCard({
  instance,
  membersMap,
  evalId,
  journeyId,
  onStatusChange,
}: {
  instance: InstanceSummary;
  membersMap: Map<string, MemberInfo>;
  evalId: string;
  journeyId: string;
  onStatusChange: () => void;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<InstanceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const statusInfo =
    instanceStatusBadge[instance.status] || instanceStatusBadge.active;
  const mentorName = instance.mentorId
    ? membersMap.get(instance.mentorId)?.name || "Mentor"
    : null;

  const toggleExpand = async () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && !detail) {
      setLoadingDetail(true);
      try {
        const res = await fetch(`/api/journey-instances/${instance.id}`);
        if (res.ok) {
          setDetail(await res.json());
        }
      } catch {
        /* silent */
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/journey-instances/${instance.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChange();
      }
    } catch {
      /* silent */
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Build participant avatars for summary (from members map using detail or just count)
  const participantAvatars: { name: string; avatarUrl: string | null }[] = [];
  if (detail) {
    detail.participants.slice(0, 5).forEach((p) => {
      participantAvatars.push({
        name: p.userName || "?",
        avatarUrl: p.userAvatar,
      });
    });
  }

  return (
    <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] overflow-hidden transition-all">
      {/* Summary Row */}
      <div
        className="p-5 cursor-pointer hover:bg-bg-elevated/30 transition-colors"
        onClick={toggleExpand}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name + Status */}
            <div className="flex items-center gap-3">
              <button className="text-dim hover:text-cream transition-colors flex-shrink-0">
                {expanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              <h3 className="text-base font-semibold text-cream truncate">
                {instance.name}
              </h3>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 ml-7 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-dim">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(instance.startDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                  {instance.endDate && (
                    <>
                      {" "}
                      &rarr;{" "}
                      {new Date(instance.endDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </>
                  )}
                </span>
              </div>
              {mentorName && (
                <div className="flex items-center gap-1.5 text-xs text-dim">
                  <Circle className="w-2.5 h-2.5 fill-accent text-accent" />
                  <span>{mentorName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-dim">
                <Users className="w-3 h-3" />
                <span>
                  {instance.participantCount} participante
                  {instance.participantCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Avatar row + Progress */}
            <div className="ml-7 space-y-2">
              {/* Avatars */}
              {participantAvatars.length > 0 && (
                <div className="flex items-center gap-0.5">
                  {participantAvatars.map((a, i) => (
                    <div
                      key={i}
                      className="-ml-1 first:ml-0"
                      style={{ zIndex: participantAvatars.length - i }}
                    >
                      <Avatar name={a.name} avatarUrl={a.avatarUrl} size="sm" />
                    </div>
                  ))}
                  {instance.participantCount > 5 && (
                    <div className="w-7 h-7 rounded-full bg-bg-elevated border border-[var(--border-color)] flex items-center justify-center text-[10px] text-dim -ml-1">
                      +{instance.participantCount - 5}
                    </div>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar percent={instance.progressPercent} />
                </div>
                <span className="text-xs text-dim font-medium whitespace-nowrap">
                  {instance.progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="flex items-center gap-1.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {instance.status === "active" && (
              <button
                onClick={() => handleStatusChange("paused")}
                disabled={updatingStatus}
                className="p-2 rounded-lg text-dim hover:text-warning hover:bg-warning/10 transition-colors disabled:opacity-40"
                title="Pausar"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            {instance.status === "paused" && (
              <button
                onClick={() => handleStatusChange("active")}
                disabled={updatingStatus}
                className="p-2 rounded-lg text-dim hover:text-success hover:bg-success/10 transition-colors disabled:opacity-40"
                title="Retomar"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            {(instance.status === "active" ||
              instance.status === "paused" ||
              instance.status === "completed") && (
              <button
                onClick={() => handleStatusChange("archived")}
                disabled={updatingStatus}
                className="p-2 rounded-lg text-dim hover:text-dim hover:bg-bg-elevated transition-colors disabled:opacity-40"
                title="Arquivar"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() =>
                router.push(
                  `/admin/${evalId}/journeys/${journeyId}/instances/${instance.id}`
                )
              }
              className="p-2 rounded-lg text-dim hover:text-accent hover:bg-accent/10 transition-colors"
              title="Ver dashboard completo"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-[var(--border-color)] bg-bg-surface/30">
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-dim" />
            </div>
          ) : detail ? (
            <div className="p-5 space-y-5">
              {/* Stage pipeline (aggregated across all participants) */}
              {detail.stages.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-dim">
                    Progresso por Etapa
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {detail.stages.map((stage) => {
                      // Aggregate: sum approved / (totalTasks * participants)
                      let totalPossible = 0;
                      let totalApproved = 0;
                      detail.participants.forEach((p) => {
                        const sp = p.stageProgress.find(
                          (s) => s.stageId === stage.id
                        );
                        if (sp) {
                          totalPossible += sp.totalTasks;
                          totalApproved += sp.approved;
                        }
                      });
                      const pct =
                        totalPossible > 0
                          ? Math.round((totalApproved / totalPossible) * 100)
                          : 0;

                      return (
                        <div
                          key={stage.id}
                          className="flex items-center gap-2 bg-bg-elevated rounded-xl px-3 py-2 border border-[var(--border-color)]"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: stage.color || "#C4A882",
                            }}
                          />
                          <span className="text-xs text-cream truncate max-w-[100px]">
                            {stage.name}
                          </span>
                          <span className="text-[10px] text-dim">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Participant table */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-dim">
                  Participantes
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-color)]">
                        <th className="text-left text-dim font-normal text-xs py-2 pr-3">
                          Participante
                        </th>
                        <th className="text-left text-dim font-normal text-xs py-2 px-3">
                          Etapa Atual
                        </th>
                        <th className="text-left text-dim font-normal text-xs py-2 px-3">
                          Tarefas
                        </th>
                        <th className="text-left text-dim font-normal text-xs py-2 px-3 w-36">
                          Progresso
                        </th>
                        <th className="text-left text-dim font-normal text-xs py-2 pl-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.participants.map((p) => {
                        const totalTasks = p.stageProgress.reduce(
                          (a, s) => a + s.totalTasks,
                          0
                        );
                        const totalApproved = p.stageProgress.reduce(
                          (a, s) => a + s.approved,
                          0
                        );
                        const pct =
                          totalTasks > 0
                            ? Math.round((totalApproved / totalTasks) * 100)
                            : 0;
                        const currentStage = p.currentStageId
                          ? detail.stages.find(
                              (s) => s.id === p.currentStageId
                            )
                          : null;
                        const pStatus =
                          participantStatusBadge[p.status] ||
                          participantStatusBadge.active;

                        return (
                          <tr
                            key={p.id}
                            className="border-b border-[var(--border-color)] last:border-0"
                          >
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  name={p.userName}
                                  avatarUrl={p.userAvatar}
                                  size="sm"
                                />
                                <span className="text-cream truncate max-w-[140px]">
                                  {p.userName || "Sem nome"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-xs text-dim">
                                {currentStage?.name || "-"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-xs text-cream">
                                {totalApproved}/{totalTasks}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 w-36">
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <ProgressBar percent={pct} size="sm" />
                                </div>
                                <span className="text-[10px] text-dim w-8 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 pl-3">
                              <Badge variant={pStatus.variant} className="text-[10px]">
                                {pStatus.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Heatmap */}
              {detail.stages.length > 0 &&
                detail.participants.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-dim">
                      Mapa de Conclusao
                    </span>
                    <div className="bg-bg-elevated/50 rounded-xl border border-[var(--border-color)] p-4">
                      <CompletionHeatmap
                        stages={detail.stages}
                        participants={detail.participants}
                      />
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-dim">
              Falha ao carregar detalhes
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function JourneyGroupsPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const journeyId = params.journeyId as string;

  const [instances, setInstances] = useState<InstanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [journeyName, setJourneyName] = useState("");
  const [journeyType, setJourneyType] = useState("custom");
  const [membersMap, setMembersMap] = useState<Map<string, MemberInfo>>(
    new Map()
  );

  const fetchInstances = useCallback(async () => {
    try {
      const res = await fetch("/api/journey-instances");
      if (res.ok) {
        const all: InstanceSummary[] = await res.json();
        const filtered = all.filter((i) => i.journeyId === journeyId);
        setInstances(filtered);
        if (filtered.length > 0) {
          setJourneyName(filtered[0].journeyName || "");
          setJourneyType(filtered[0].journeyType || "custom");
        }
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [journeyId]);

  // Fetch journey info directly if no instances
  const fetchJourneyInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/journeys/${journeyId}`);
      if (res.ok) {
        const data = await res.json();
        setJourneyName(data.name || "");
        setJourneyType(data.journeyType || "custom");
      }
    } catch {
      /* silent */
    }
  }, [journeyId]);

  // Fetch members for mentor name resolution
  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const members: MemberInfo[] = await res.json();
        const map = new Map<string, MemberInfo>();
        members.forEach((m) => map.set(m.id, m));
        setMembersMap(map);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchInstances();
    fetchMembers();
    fetchJourneyInfo();
  }, [fetchInstances, fetchMembers, fetchJourneyInfo]);

  // ─── Computed Stats ─────────────────────────────────────────────────────────

  const totalParticipants = instances.reduce(
    (a, i) => a + i.participantCount,
    0
  );
  const avgProgress =
    instances.length > 0
      ? Math.round(
          instances.reduce((a, i) => a + i.progressPercent, 0) /
            instances.length
        )
      : 0;

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-dim" />
      </div>
    );
  }

  const jType = journeyType || "custom";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back link */}
      <button
        onClick={() =>
          router.push(`/admin/${evalId}/journeys/${journeyId}`)
        }
        className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Jornada
      </button>

      {/* Header Card */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-serif text-cream">
                {journeyName || "Grupos"}
              </h1>
              <Badge variant={typeBadgeVariant[jType] || "default"}>
                {typeLabels[jType] || jType}
              </Badge>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-cream">
                    {instances.length}
                  </p>
                  <p className="text-[10px] text-dim uppercase tracking-wider">
                    Turma{instances.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-[var(--border-color)]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-cream">
                    {totalParticipants}
                  </p>
                  <p className="text-[10px] text-dim uppercase tracking-wider">
                    Participantes
                  </p>
                </div>
              </div>
              <div className="w-px h-8 bg-[var(--border-color)]" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-cream">
                    {avgProgress}%
                  </p>
                  <p className="text-[10px] text-dim uppercase tracking-wider">
                    Progresso Medio
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/admin/${evalId}/journeys/${journeyId}/start`
              )
            }
          >
            <Plus className="w-4 h-4" />
            Iniciar Nova Turma
          </Button>
        </div>
      </div>

      {/* Instances List */}
      {instances.length === 0 ? (
        <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-base font-semibold text-cream mb-1">
            Nenhuma turma iniciada
          </h3>
          <p className="text-sm text-dim mb-4">
            Inicie a primeira turma desta jornada para acompanhar o progresso dos
            participantes.
          </p>
          <Button
            size="sm"
            onClick={() =>
              router.push(
                `/admin/${evalId}/journeys/${journeyId}/start`
              )
            }
          >
            <Plus className="w-4 h-4" />
            Iniciar Turma
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {instances.map((instance) => (
            <InstanceCard
              key={instance.id}
              instance={instance}
              membersMap={membersMap}
              evalId={evalId}
              journeyId={journeyId}
              onStatusChange={fetchInstances}
            />
          ))}
        </div>
      )}
    </div>
  );
}
