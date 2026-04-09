"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Upload,
  Link2,
  HelpCircle,
  CheckSquare,
  Play,
  Users,
  Download,
  ChevronDown,
  ChevronRight,
  Check,
  Clock,
  X,
  Eye,
  Filter,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TaskRow {
  id: string;
  stageId: string;
  name: string;
  taskType: string;
  isRequired: number;
  reviewType: string;
  maxScore: number;
}

interface StageRow {
  id: string;
  name: string;
  sortOrder: number;
  color: string | null;
  tasks: TaskRow[];
}

interface Submission {
  id: string;
  instanceId: string;
  taskId: string;
  userId: string;
  userName: string;
  instanceName: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  linkUrl: string | null;
  status: string;
  score: number | null;
  submittedAt: string;
  reviews: {
    id: string;
    reviewType: string;
    score: number | null;
    feedback: string | null;
    status: string;
  }[];
}

interface Participant {
  id: string;
  userId: string;
  userName: string;
  instanceName: string;
  instanceId: string;
  role: string;
  status: string;
}

interface Instance {
  id: string;
  name: string;
  status: string;
}

interface ResponsesData {
  journey: { id: string; name: string; color: string | null };
  stages: StageRow[];
  submissions: Submission[];
  participants: Participant[];
  instances: Instance[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const taskTypeLabels: Record<string, string> = {
  text: "Texto", file: "Arquivo", link: "Link", quiz: "Quiz",
  checklist: "Checklist", video: "Video", attendance: "Presenca", material: "Material",
};

const taskTypeIcons: Record<string, typeof FileText> = {
  text: FileText, file: Upload, link: Link2, quiz: HelpCircle,
  checklist: CheckSquare, video: Play, attendance: Users, material: Download,
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  submitted: "Enviada",
  under_review: "Em revisao",
  approved: "Aprovada",
  revision_requested: "Revisao solicitada",
};

const statusColors: Record<string, string> = {
  draft: "text-dim",
  submitted: "text-blue-400",
  under_review: "text-amber-400",
  approved: "text-emerald-400",
  revision_requested: "text-red-400",
};

const statusIcons: Record<string, typeof Check> = {
  draft: Clock,
  submitted: Eye,
  under_review: Clock,
  approved: Check,
  revision_requested: X,
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const journeyId = params.journeyId as string;

  const [data, setData] = useState<ResponsesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [filterInstance, setFilterInstance] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/journeys/${journeyId}/responses`);
      if (res.ok) {
        const d: ResponsesData = await res.json();
        setData(d);
        if (expandedStages.size === 0 && d.stages.length > 0) {
          setExpandedStages(new Set(d.stages.map((s) => s.id)));
        }
      }
    } catch (err) {
      console.error("Failed to fetch responses:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="ml-2 text-sm text-dim">Carregando respostas...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-dim">Dados nao encontrados.</p>
      </div>
    );
  }

  const { journey, stages, submissions, participants, instances } = data;

  // Get submissions for a specific task, filtered
  const getTaskSubmissions = (taskId: string) => {
    return submissions.filter((s) => {
      if (s.taskId !== taskId) return false;
      if (filterInstance !== "all" && s.instanceId !== filterInstance) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      return true;
    });
  };

  // Stats
  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const pendingCount = submissions.filter((s) => s.status === "submitted" || s.status === "under_review").length;
  const totalParticipants = new Set(participants.map((p) => p.userId)).size;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back link */}
      <button
        onClick={() => router.push(`/admin/${evalId}/journeys/${journeyId}`)}
        className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para jornada
      </button>

      {/* Header */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: journey.color || "#C4A882" }}
              />
              <h1 className="text-2xl font-serif text-cream">Respostas</h1>
              <Badge variant="default">{journey.name}</Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 ml-6 text-xs text-dim">
              <span>{totalParticipants} participantes</span>
              <span>{totalSubmissions} respostas</span>
              <span className="text-emerald-400">{approvedCount} aprovadas</span>
              <span className="text-amber-400">{pendingCount} pendentes</span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-dim" />
              <select
                value={filterInstance}
                onChange={(e) => setFilterInstance(e.target.value)}
                className="bg-bg-elevated border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-cream"
              >
                <option value="all">Todas as turmas</option>
                {instances.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-bg-elevated border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-xs text-cream"
            >
              <option value="all">Todos os status</option>
              <option value="submitted">Enviadas</option>
              <option value="approved">Aprovadas</option>
              <option value="revision_requested">Revisao solicitada</option>
              <option value="under_review">Em revisao</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stages with tasks and submissions */}
      <div className="space-y-3">
        {stages.map((stage) => {
          const isExpanded = expandedStages.has(stage.id);

          return (
            <div
              key={stage.id}
              className="bg-bg-card rounded-xl border border-[var(--border-color)] overflow-hidden"
            >
              {/* Stage header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-bg-elevated/50 transition-colors"
                onClick={() => toggleStage(stage.id)}
              >
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stage.color || "#C4A882" }}
                />
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-dim flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-dim flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-cream flex-1">
                  {stage.name}
                </span>
                <Badge variant="default">
                  {stage.tasks.length} tarefa{stage.tasks.length !== 1 ? "s" : ""}
                </Badge>
                {/* Submission count for stage */}
                {(() => {
                  const stageTaskIds = stage.tasks.map((t) => t.id);
                  const stageSubs = submissions.filter((s) => stageTaskIds.includes(s.taskId));
                  return (
                    <span className="text-[11px] text-dim">
                      {stageSubs.length} resposta{stageSubs.length !== 1 ? "s" : ""}
                    </span>
                  );
                })()}
              </div>

              {/* Tasks */}
              {isExpanded && (
                <div className="border-t border-[var(--border-color)]">
                  {stage.tasks.map((task) => {
                    const TaskIcon = taskTypeIcons[task.taskType] || FileText;
                    const taskSubs = getTaskSubmissions(task.id);
                    const isSelected = selectedTask === task.id;

                    return (
                      <div key={task.id}>
                        {/* Task row */}
                        <div
                          className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-accent/5 border-l-2 border-l-accent"
                              : "hover:bg-bg-elevated/30 border-l-2 border-l-transparent"
                          }`}
                          onClick={() =>
                            setSelectedTask(isSelected ? null : task.id)
                          }
                        >
                          <TaskIcon className="w-4 h-4 text-dim flex-shrink-0" />
                          <span className="text-sm text-cream flex-1">
                            {task.name}
                          </span>
                          <Badge variant="default">
                            {taskTypeLabels[task.taskType]}
                          </Badge>
                          <span className="text-xs text-dim">
                            {taskSubs.length} resposta{taskSubs.length !== 1 ? "s" : ""}
                          </span>
                          {isSelected ? (
                            <ChevronDown className="w-3.5 h-3.5 text-dim" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-dim" />
                          )}
                        </div>

                        {/* Submissions for this task */}
                        {isSelected && (
                          <div className="bg-bg-elevated/20 border-t border-[var(--border-color)]">
                            {taskSubs.length === 0 ? (
                              <div className="px-8 py-4 text-xs text-dim italic">
                                Nenhuma resposta para esta tarefa.
                              </div>
                            ) : (
                              <div className="divide-y divide-[var(--border-color)]">
                                {taskSubs.map((sub) => {
                                  const StatusIcon = statusIcons[sub.status] || Clock;
                                  return (
                                    <div
                                      key={sub.id}
                                      className="px-8 py-3 space-y-2"
                                    >
                                      {/* Submission header */}
                                      <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                                          {sub.userName
                                            .split(" ")
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm text-cream font-medium truncate">
                                            {sub.userName}
                                          </p>
                                          <p className="text-[10px] text-dim">
                                            {sub.instanceName} ·{" "}
                                            {new Date(sub.submittedAt).toLocaleDateString("pt-BR", {
                                              day: "2-digit",
                                              month: "short",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </p>
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs ${statusColors[sub.status] || "text-dim"}`}>
                                          <StatusIcon className="w-3 h-3" />
                                          {statusLabels[sub.status] || sub.status}
                                        </div>
                                        {sub.score !== null && (
                                          <Badge variant="accent">
                                            {sub.score}/{task.maxScore}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Content */}
                                      {sub.content && (
                                        <div className="ml-10 p-3 rounded-lg bg-bg-card border border-[var(--border-color)]">
                                          <p className="text-xs text-cream whitespace-pre-wrap line-clamp-4">
                                            {sub.content}
                                          </p>
                                        </div>
                                      )}

                                      {/* File */}
                                      {sub.fileUrl && (
                                        <div className="ml-10 flex items-center gap-2">
                                          <a
                                            href={sub.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 text-xs text-accent hover:underline"
                                          >
                                            <Download className="w-3 h-3" />
                                            {sub.fileName || "Arquivo"}
                                          </a>
                                        </div>
                                      )}

                                      {/* Link */}
                                      {sub.linkUrl && (
                                        <div className="ml-10">
                                          <a
                                            href={sub.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-accent hover:underline"
                                          >
                                            {sub.linkUrl}
                                          </a>
                                        </div>
                                      )}

                                      {/* Reviews */}
                                      {sub.reviews.length > 0 && (
                                        <div className="ml-10 space-y-1.5">
                                          {sub.reviews.map((rev) => (
                                            <div
                                              key={rev.id}
                                              className="flex items-start gap-2 p-2 rounded bg-bg-card/50"
                                            >
                                              <Badge variant="info" className="text-[9px] mt-0.5">
                                                {rev.reviewType === "ai" ? "IA" : rev.reviewType === "auto" ? "Auto" : "Mentor"}
                                              </Badge>
                                              <div className="flex-1 min-w-0">
                                                {rev.feedback && (
                                                  <p className="text-[11px] text-dim">
                                                    {rev.feedback}
                                                  </p>
                                                )}
                                              </div>
                                              {rev.score !== null && (
                                                <span className="text-[10px] text-accent font-medium">
                                                  {rev.score}
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {submissions.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-8 h-8 text-dim mx-auto mb-3" />
          <p className="text-sm text-dim">Nenhuma resposta ainda.</p>
          <p className="text-xs text-dim/60 mt-1">
            As respostas aparecerao aqui conforme os participantes enviarem.
          </p>
        </div>
      )}
    </div>
  );
}
