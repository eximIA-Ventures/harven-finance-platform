"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Loader2, Check, CheckCircle2, Circle, Clock, Lock,
  FileText, Upload, Link2, HelpCircle, CheckSquare, AlertCircle,
  Star, Send, LayoutGrid, Users, ExternalLink, Info,
} from "lucide-react";

// --- Types ------------------------------------------------------------------

interface TaskConfig {
  url?: string; buttonLabel?: string; completionType?: string; confirmLabel?: string;
  perMember?: boolean; allowedTypes?: string[]; maxSizeMb?: number; label?: string;
  fields?: Array<{ key: string; label: string; placeholder?: string; type?: string; required?: boolean }>;
  placeholder?: string; minLength?: number; maxLength?: number; hint?: string;
  items?: string[];
}

interface MemberTaskStatus {
  userId: string; name: string | null; avatar: string | null; submitted: boolean; approved: boolean;
}

interface TaskStatus {
  taskId: string; taskName: string; taskType: string; description: string | null;
  isRequired: boolean; scope: string; reviewType: string; maxScore: number; config: TaskConfig | null;
  status: string; score: number | null; submittedAt: string | null;
  reviewFeedback: string | null; reviewScore: number | null;
  memberStatus: MemberTaskStatus[] | null;
}

interface StageProgress {
  stageId: string; stageName: string; stageColor: string | null; sortOrder: number;
  isCurrent: boolean; tasks: TaskStatus[]; completedCount: number; totalTasks: number;
  totalRequired: number; requiredCompleted: number; stageComplete: boolean;
}

interface ProgressData {
  instanceId: string; participantStatus: string; currentStageId: string | null;
  completedAt: string | null; overallProgress: number; stages: StageProgress[];
}

interface InstanceParticipant {
  id: string; userId: string; role: string; status: string;
  currentStageId: string | null; completedAt: string | null; joinedAt: string;
  userName: string | null; userAvatar: string | null; memberStatus: string | null;
}

interface InstanceData {
  id: string; journeyId: string; name: string; status: string; mentorId: string | null;
  journey: { id: string; name: string; description: string | null } | null;
  participants: InstanceParticipant[];
}

// --- Constants --------------------------------------------------------------

const inputCls = "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

const taskTypeIcons: Record<string, typeof FileText> = { text: FileText, file: Upload, link: Link2, quiz: HelpCircle, checklist: CheckSquare };
const taskTypeLabels: Record<string, string> = { text: "Texto", file: "Arquivo", link: "Link", quiz: "Quiz", checklist: "Checklist" };
const statusConfig: Record<string, { label: string; color: string; icon: typeof Circle }> = {
  pending: { label: "Pendente", color: "text-dim/40", icon: Circle },
  submitted: { label: "Em revisao", color: "text-blue-400", icon: Clock },
  approved: { label: "Aprovado", color: "text-success", icon: CheckCircle2 },
  revision_requested: { label: "Revisar", color: "text-warning", icon: AlertCircle },
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// --- Main Page --------------------------------------------------------------

export default function TaskViewPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const instanceId = params.instanceId as string;

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [taskInputs, setTaskInputs] = useState<Record<string, { content: string; link_url: string; file_url: string; file_name: string }>>({});

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}/progress`);
      if (res.ok) {
        const data: ProgressData = await res.json();
        setProgress(data);
        if (!selectedStageId) {
          const current = data.stages.find(s => s.isCurrent);
          setSelectedStageId(current?.stageId || data.stages[0]?.stageId || null);
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [instanceId, selectedStageId]);

  const fetchInstanceData = useCallback(async () => {
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}`);
      if (res.ok) setInstanceData(await res.json());
    } catch { /* silent */ }
  }, [instanceId]);

  useEffect(() => { fetchProgress(); fetchInstanceData(); }, [fetchProgress, fetchInstanceData]);

  const getInput = (taskId: string) => taskInputs[taskId] || { content: "", link_url: "", file_url: "", file_name: "" };
  const handleFileUpload = async (taskId: string, file: File) => {
    setUploading(taskId);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/journey", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setTaskInputs(prev => ({ ...prev, [taskId]: { ...getInput(taskId), file_url: data.url, file_name: data.fileName } }));
      } else {
        const err = await res.json();
        setUploadError(err.error || "Erro no upload");
      }
    } catch {
      setUploadError("Erro de conexao");
    } finally {
      setUploading(null);
    }
  };

  const setInput = (taskId: string, field: "content" | "link_url" | "file_url" | "file_name", value: string) => {
    setTaskInputs(prev => ({ ...prev, [taskId]: { ...getInput(taskId), [field]: value } }));
  };

  const handleSubmit = async (task: TaskStatus) => {
    const input = getInput(task.taskId);
    setSubmitting(task.taskId);
    try {
      const body: Record<string, unknown> = { task_id: task.taskId };
      if (task.taskType === "text") body.content = input.content;
      if (task.taskType === "link") body.link_url = input.link_url;
      if (task.taskType === "file") { body.file_url = input.file_url; body.file_name = input.file_url.split("/").pop() || "arquivo"; }
      const res = await fetch(`/api/journey-instances/${instanceId}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) { setTaskInputs(prev => { const next = { ...prev }; delete next[task.taskId]; return next; }); await fetchProgress(); }
    } catch { /* silent */ }
    finally { setSubmitting(null); }
  };

  if (loading) {
    return (<div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-accent" /><span className="ml-2 text-sm text-dim">Carregando jornada...</span></div>);
  }
  if (!progress) {
    return (<div className="text-center py-20"><p className="text-dim">Jornada nao encontrada.</p><button onClick={() => router.push(`/admin/${evalId}/my-journeys`)} className="mt-4 text-accent hover:underline text-sm">Voltar</button></div>);
  }

  const selectedStage = progress.stages.find(s => s.stageId === selectedStageId);
  const unlockedStageIds = new Set<string>();
  for (const stage of progress.stages) { unlockedStageIds.add(stage.stageId); if (!stage.stageComplete) break; }

  const members = instanceData?.participants.filter(p => p.role !== "mentor") || [];
  const mentor = instanceData?.participants.find(p => p.role === "mentor") || null;
  const journeyName = instanceData?.journey?.name || "Jornada";
  const instanceName = instanceData?.name || "";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back + Quadro button */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(`/admin/${evalId}/my-journeys`)} className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors">
          <ArrowLeft className="w-4 h-4" /> Minhas Jornadas
        </button>
        <Link href={`/admin/${evalId}/my-journeys/${instanceId}/kanban`} className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-[var(--border-color)] rounded-xl text-sm text-cream hover:border-accent/20 transition-all">
          <LayoutGrid className="w-4 h-4 text-accent" /> Quadro de Tarefas
        </Link>
      </div>

      {/* Header card with progress + team inline */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-serif text-cream">{journeyName}</h1>
            {instanceName && instanceName !== journeyName && <p className="text-xs text-dim mt-0.5">{instanceName}</p>}
          </div>
          <Badge variant={progress.participantStatus === "completed" ? "accent" : progress.participantStatus === "active" ? "success" : "default"}>
            {progress.participantStatus === "completed" ? "Concluida" : progress.participantStatus === "active" ? "Em andamento" : progress.participantStatus}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-dim">Progresso geral</span>
            <span className="text-cream font-semibold">{progress.overallProgress}%</span>
          </div>
          <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${progress.overallProgress === 100 ? "bg-success" : "bg-accent"}`} style={{ width: `${progress.overallProgress}%` }} />
          </div>
        </div>

      </div>

      {/* Two-panel: stages + tasks */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* LEFT: Stage stepper */}
        <div className="lg:w-56 flex-shrink-0 space-y-3 lg:sticky lg:top-6 lg:self-start">
          {/* Team card */}
          <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-dim mb-3">Equipe</h3>
            <div className="space-y-2.5">
              {mentor && (
                <div className="flex items-center gap-2.5">
                  {mentor.userAvatar ? (
                    <img src={mentor.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-accent/20" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-bold text-accent ring-2 ring-accent/20">{getInitials(mentor.userName)}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs text-cream font-medium block truncate">{mentor.userName}</span>
                    <span className="inline-block mt-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider bg-accent/10 text-accent">Mentor</span>
                  </div>
                </div>
              )}
              {members.map(m => {
                const statusMap: Record<string, { label: string; cls: string }> = {
                  presidente: { label: "Presidente", cls: "bg-amber-500/10 text-amber-500" },
                  "vice-presidente": { label: "Vice", cls: "bg-amber-500/8 text-amber-400" },
                  trainee: { label: "Trainee", cls: "bg-bg-elevated text-dim" },
                  alumni: { label: "Alumni", cls: "bg-bg-elevated text-dim/60" },
                };
                const st = statusMap[m.memberStatus || ""] || { label: "Membro", cls: "bg-bg-elevated text-dim" };
                return (
                  <div key={m.id} className="flex items-center gap-2.5">
                    {m.userAvatar ? (
                      <img src={m.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">{getInitials(m.userName)}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-cream font-medium block truncate">{m.userName}</span>
                      <span className={`inline-block mt-0.5 px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider ${st.cls}`}>{st.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stages card */}
          <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-3 space-y-0.5">
            {progress.stages.map((stage, i) => {
              const isSelected = stage.stageId === selectedStageId;
              const isUnlocked = unlockedStageIds.has(stage.stageId);
              const isComplete = stage.stageComplete;
              return (
                <button key={stage.stageId} onClick={() => { if (isUnlocked) setSelectedStageId(stage.stageId); }} disabled={!isUnlocked}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${isSelected ? "bg-accent/10" : isUnlocked ? "hover:bg-bg-elevated" : "opacity-35 cursor-not-allowed"}`}>
                  {isComplete ? (
                    <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0"><Check className="w-3.5 h-3.5 text-success" /></div>
                  ) : stage.isCurrent ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2" style={{ borderColor: stage.stageColor || "#C4A882" }}>
                      <span className="text-[10px] font-semibold" style={{ color: stage.stageColor || "#C4A882" }}>{i + 1}</span>
                    </div>
                  ) : !isUnlocked ? (
                    <div className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center flex-shrink-0"><Lock className="w-3 h-3 text-dim/40" /></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center flex-shrink-0"><span className="text-[10px] text-dim font-medium">{i + 1}</span></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-medium block truncate ${isSelected || isUnlocked ? "text-cream" : "text-dim"}`}>{stage.stageName}</span>
                    <span className="text-[10px] text-dim">{stage.completedCount}/{stage.totalTasks}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Tasks */}
        <div className="flex-1 min-w-0">
          {selectedStage ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedStage.stageColor || "#C4A882" }} />
                <h2 className="text-lg font-semibold text-cream">{selectedStage.stageName}</h2>
                <span className="text-xs text-dim">{selectedStage.completedCount}/{selectedStage.totalTasks} concluidas</span>
              </div>

              {selectedStage.tasks.map(task => {
                const sc = statusConfig[task.status] || statusConfig.pending;
                const StatusIcon = sc.icon;
                const TaskIcon = taskTypeIcons[task.taskType] || FileText;
                const input = getInput(task.taskId);
                const isSubmittingThis = submitting === task.taskId;
                const canSubmit = task.status === "pending" || task.status === "revision_requested";
                const cfg = task.config;

                return (
                  <div key={task.taskId} className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <TaskIcon className="w-4 h-4 text-accent flex-shrink-0" />
                        <div>
                          <span className="text-sm font-medium text-cream">{task.taskName}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-dim">{taskTypeLabels[task.taskType]}</span>
                            {task.isRequired && <Badge variant="accent" className="text-[9px] px-1.5 py-0">Obrigatoria</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 ${sc.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">{sc.label}</span>
                      </div>
                    </div>

                    {task.status === "approved" && (
                      <div className="bg-success/5 border border-success/15 rounded-xl px-4 py-3 space-y-2">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                          <span className="text-sm text-success font-medium">Aprovado</span>
                          {(task.reviewScore ?? task.score) !== null && <span className="text-xs text-dim"><Star className="w-3 h-3 inline mr-0.5" />{task.reviewScore ?? task.score}/{task.maxScore}</span>}
                        </div>
                        {task.reviewFeedback && (
                          <div className="ml-8 text-xs text-cream/80 bg-success/5 rounded-lg px-3 py-2 border-l-2 border-success/30">
                            <span className="text-[10px] text-dim block mb-0.5">Feedback do mentor:</span>
                            {task.reviewFeedback}
                          </div>
                        )}
                      </div>
                    )}

                    {task.status === "submitted" && (
                      <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3">
                        <Clock className="w-5 h-5 text-blue-400 flex-shrink-0" /><span className="text-sm text-blue-400">Aguardando revisao do mentor</span>
                      </div>
                    )}

                    {task.status === "revision_requested" && (
                      <div className="bg-warning/5 border border-warning/15 rounded-xl px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-warning" /><span className="text-sm text-warning font-medium">Revisao solicitada</span></div>
                        {task.reviewFeedback && (
                          <div className="text-xs text-cream/80 bg-warning/5 rounded-lg px-3 py-2 border-l-2 border-warning/30">
                            <span className="text-[10px] text-dim block mb-0.5">Comentario do mentor:</span>
                            {task.reviewFeedback}
                          </div>
                        )}
                        <p className="text-xs text-dim">Reenvie sua submissao com os ajustes solicitados.</p>
                      </div>
                    )}

                    {/* Member completion for individual tasks */}
                    {task.scope === "individual" && task.memberStatus && task.memberStatus.length > 1 && (
                      <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-bg-elevated">
                        <span className="text-[10px] text-dim flex-shrink-0">Membros:</span>
                        <div className="flex gap-2 flex-wrap">
                          {task.memberStatus.map(m => (
                            <div key={m.userId} className="flex items-center gap-1.5" title={m.name || ""}>
                              {m.avatar ? (
                                <img src={m.avatar} alt="" className={`w-5 h-5 rounded-full object-cover ${m.approved ? "ring-2 ring-success" : m.submitted ? "ring-2 ring-blue-400" : "opacity-40"}`} />
                              ) : (
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${m.approved ? "bg-success/15 text-success ring-2 ring-success" : m.submitted ? "bg-blue-400/15 text-blue-400 ring-2 ring-blue-400" : "bg-bg-card text-dim/40"}`}>
                                  {(m.name || "?")[0].toUpperCase()}
                                </div>
                              )}
                              <span className={`text-[10px] ${m.approved ? "text-success" : m.submitted ? "text-blue-400" : "text-dim/40"}`}>
                                {m.approved ? "✓" : m.submitted ? "⏳" : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Group task indicator */}
                    {task.scope === "group" && task.status === "pending" && (
                      <div className="flex items-center gap-2 text-[10px] text-dim px-1">
                        <Users className="w-3 h-3" />
                        <span>Tarefa do grupo — qualquer membro pode enviar</span>
                      </div>
                    )}

                    {canSubmit && (
                      <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
                        {/* Description */}
                        {task.description && <p className="text-xs text-dim">{task.description}</p>}

                        {/* Hint */}
                        {cfg?.hint && (
                          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10">
                            <Info className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-[11px] text-accent/80">{cfg.hint}</span>
                          </div>
                        )}

                        {/* LINK — with pre-defined URL + confirm button */}
                        {task.taskType === "link" && cfg?.url && cfg?.completionType === "confirm" ? (
                          <div className="space-y-3">
                            <a href={cfg.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-3 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream hover:border-accent/20 transition-all">
                              <ExternalLink className="w-4 h-4 text-accent" />
                              <span className="flex-1">{cfg.buttonLabel || cfg.url}</span>
                              <span className="text-[10px] text-dim">Abrir em nova aba</span>
                            </a>
                            <button onClick={() => { setInput(task.taskId, "link_url", cfg.url!); setTimeout(() => handleSubmit({ ...task, taskType: "link" }), 100); }}
                              disabled={isSubmittingThis}
                              className="w-full px-4 py-2.5 bg-success/10 border border-success/20 text-success rounded-xl text-sm font-medium hover:bg-success/15 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                              {isSubmittingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              {cfg.confirmLabel || "Confirmar conclusao"}
                            </button>
                          </div>
                        ) : task.taskType === "link" ? (
                          <input type="url" value={input.link_url} onChange={e => setInput(task.taskId, "link_url", e.target.value)} placeholder={cfg?.placeholder || "https://..."} className={inputCls} />
                        ) : null}

                        {/* TEXT — with optional structured fields */}
                        {task.taskType === "text" && cfg?.fields ? (
                          <div className="space-y-3">
                            {cfg.fields.map(field => (
                              <div key={field.key}>
                                <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">{field.label}{field.required && " *"}</label>
                                {field.type === "textarea" ? (
                                  <textarea value={((() => { try { const p = JSON.parse(input.content || "{}"); return p[field.key] || ""; } catch { return ""; } })())}
                                    onChange={e => { try { const p = JSON.parse(input.content || "{}"); p[field.key] = e.target.value; setInput(task.taskId, "content", JSON.stringify(p)); } catch { setInput(task.taskId, "content", JSON.stringify({ [field.key]: e.target.value })); } }}
                                    placeholder={field.placeholder} rows={3} className={`${inputCls} resize-none`} />
                                ) : (
                                  <input value={((() => { try { const p = JSON.parse(input.content || "{}"); return p[field.key] || ""; } catch { return ""; } })())}
                                    onChange={e => { try { const p = JSON.parse(input.content || "{}"); p[field.key] = e.target.value; setInput(task.taskId, "content", JSON.stringify(p)); } catch { setInput(task.taskId, "content", JSON.stringify({ [field.key]: e.target.value })); } }}
                                    placeholder={field.placeholder} className={inputCls} />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : task.taskType === "text" ? (
                          <textarea value={input.content} onChange={e => setInput(task.taskId, "content", e.target.value)}
                            placeholder={cfg?.placeholder || "Escreva sua resposta..."} rows={4} className={`${inputCls} resize-none`} />
                        ) : null}

                        {/* FILE — upload dropzone */}
                        {task.taskType === "file" && (
                          <div className="space-y-3">
                            {cfg?.allowedTypes && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-dim">Formatos:</span>
                                {cfg.allowedTypes.map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-bg-elevated text-[9px] text-dim uppercase">{t}</span>)}
                                {cfg.maxSizeMb && <span className="text-[10px] text-dim ml-1">Max {cfg.maxSizeMb}MB</span>}
                              </div>
                            )}

                            {input.file_url ? (
                              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success/5 border border-success/15">
                                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-cream block truncate">{input.file_name || "Arquivo enviado"}</span>
                                  <a href={input.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-accent hover:underline">Ver arquivo</a>
                                </div>
                                <button onClick={() => { setInput(task.taskId, "file_url", ""); setInput(task.taskId, "file_name", ""); }} className="text-dim hover:text-red-400 transition-colors">
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-[var(--border-color)] cursor-pointer transition-all hover:border-accent/30 hover:bg-accent/5 ${uploading === task.taskId ? "opacity-60 pointer-events-none" : ""}`}>
                                {uploading === task.taskId ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                                ) : (
                                  <Upload className="w-6 h-6 text-dim" />
                                )}
                                <span className="text-sm text-dim">{uploading === task.taskId ? "Enviando..." : "Clique para selecionar arquivo"}</span>
                                <span className="text-[10px] text-dim/50">ou arraste e solte aqui</span>
                                <input type="file" className="hidden" accept={cfg?.allowedTypes?.map(t => `.${t}`).join(",") || "*"} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(task.taskId, f); e.target.value = ""; }} />
                              </label>
                            )}
                            {uploadError && (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15 text-xs text-red-400">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {uploadError}
                              </div>
                            )}
                          </div>
                        )}

                        {/* CHECKLIST — interactive items */}
                        {task.taskType === "checklist" && cfg?.items && (
                          <div className="space-y-2">
                            {cfg.items.map((item, idx) => {
                              let checked: string[] = [];
                              try { checked = JSON.parse(input.content || "[]"); } catch { /* silent */ }
                              const isChecked = checked.includes(item);
                              return (
                                <label key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${isChecked ? "bg-success/5 border-success/20" : "bg-bg-elevated border-[var(--border-color)] hover:border-accent/20"}`}>
                                  <input type="checkbox" checked={isChecked} onChange={() => {
                                    const next = isChecked ? checked.filter(c => c !== item) : [...checked, item];
                                    setInput(task.taskId, "content", JSON.stringify(next));
                                  }} className="w-4 h-4 rounded border-[var(--border-color)] text-success focus:ring-success" />
                                  <span className={`text-sm ${isChecked ? "text-cream line-through opacity-60" : "text-cream"}`}>{item}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {task.taskType === "quiz" && <div className="bg-bg-elevated rounded-xl p-4 text-center"><HelpCircle className="w-6 h-6 text-dim/30 mx-auto mb-2" /><p className="text-xs text-dim">Quiz em breve</p></div>}

                        {/* Submit button */}
                        {!(task.taskType === "link" && cfg?.completionType === "confirm") && ["text", "link", "file", "checklist"].includes(task.taskType) && (
                          <div className="flex justify-end">
                            <button onClick={() => handleSubmit(task)} disabled={isSubmittingThis || (task.taskType === "text" && !input.content) || (task.taskType === "link" && !input.link_url) || (task.taskType === "file" && !input.file_url) || (task.taskType === "checklist" && !input.content)}
                              className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                              {isSubmittingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-8 text-center">
              <p className="text-sm text-dim">Selecione uma etapa para ver as tarefas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
