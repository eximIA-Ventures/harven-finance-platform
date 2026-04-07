"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Type,
  ListChecks,
  Star,
  Check,
  X,
  Download,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface TaskConfig {
  hint?: string;
  placeholder?: string;
  allowedTypes?: string[];
  maxFileSize?: number;
  fields?: Array<{ key: string; label: string; type?: string }>;
  items?: Array<{ label: string }>;
  [key: string]: unknown;
}

interface TaskRow {
  id: string;
  name: string;
  description: string | null;
  taskType: string;
  isRequired: number;
  reviewType: string;
  maxScore: number;
  sortOrder: number;
  config: string | null;
  parsedConfig: TaskConfig | null;
}

interface StageRow {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  sortOrder: number;
  tasks: TaskRow[];
}

interface StageProgress {
  stageId: string;
  stageName: string;
  totalTasks: number;
  submitted: number;
  approved: number;
}

interface SubmissionRow {
  id: string;
  taskId: string;
  userId: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  linkUrl: string | null;
  status: string;
  score: number | null;
  submittedAt: string;
  updatedAt: string;
  reviewFeedback: string | null;
  reviewScore: number | null;
  reviewedAt: string | null;
}

interface ParticipantRow {
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

interface InstanceDetail {
  id: string;
  journeyId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string | null;
  mentorId: string | null;
  createdAt: string;
  journey: {
    id: string;
    name: string;
    journeyType: string | null;
    color: string | null;
  } | null;
  stages: StageRow[];
  participants: ParticipantRow[];
  submissions: SubmissionRow[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

const instanceStatusBadge: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "accent" | "default" }
> = {
  active: { label: "Em andamento", variant: "success" },
  completed: { label: "Concluida", variant: "accent" },
  paused: { label: "Pausada", variant: "warning" },
  archived: { label: "Arquivada", variant: "default" },
};

const taskTypeBadge: Record<string, { label: string; icon: typeof Type }> = {
  text: { label: "Texto", icon: Type },
  file: { label: "Arquivo", icon: FileText },
  link: { label: "Link", icon: LinkIcon },
  checklist: { label: "Checklist", icon: ListChecks },
  quiz: { label: "Quiz", icon: ListChecks },
};

const reviewTypeBadge: Record<string, string> = {
  mentor: "Mentor",
  peer: "Peer",
  ai: "IA",
  auto: "Auto",
};

// ─── Helper: format date ────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Helper: render submission content ──────────────────────────────────────

function SubmissionContent({
  submission,
  taskType,
  config,
}: {
  submission: SubmissionRow;
  taskType: string;
  config: TaskConfig | null;
}) {
  // Checklist: parse content as JSON array of checked items
  if (taskType === "checklist" && submission.content) {
    try {
      const items: Array<{ label: string; checked: boolean }> = JSON.parse(submission.content);
      if (Array.isArray(items)) {
        return (
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {item.checked ? (
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-dim/40 flex-shrink-0" />
                )}
                <span className={item.checked ? "text-cream" : "text-dim"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        );
      }
    } catch {
      /* fall through to text rendering */
    }
  }

  // Structured text with fields: parse content as JSON object
  if (config?.fields && submission.content) {
    try {
      const data = JSON.parse(submission.content);
      if (typeof data === "object" && !Array.isArray(data)) {
        return (
          <div className="space-y-2">
            {config.fields.map((field) => (
              <div key={field.key}>
                <span className="text-[10px] uppercase tracking-wider text-dim">
                  {field.label}
                </span>
                <p className="text-sm text-cream whitespace-pre-wrap mt-0.5">
                  {data[field.key] || "—"}
                </p>
              </div>
            ))}
          </div>
        );
      }
    } catch {
      /* fall through to text rendering */
    }
  }

  const hasText = !!submission.content;
  const hasLink = !!submission.linkUrl;
  const hasFile = !!submission.fileUrl;

  if (!hasText && !hasLink && !hasFile) {
    return <p className="text-xs text-dim italic">Sem conteudo</p>;
  }

  return (
    <div className="space-y-2">
      {hasText && (
        <div className="bg-bg-elevated rounded-xl p-3 text-sm text-cream whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
          {submission.content}
        </div>
      )}
      {hasLink && (
        <a
          href={submission.linkUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline break-all"
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          {submission.linkUrl}
        </a>
      )}
      {hasFile && (
        <a
          href={submission.fileUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <Download className="w-3.5 h-3.5 flex-shrink-0" />
          {submission.fileName || "Download arquivo"}
        </a>
      )}
    </div>
  );
}

// ─── Inline Review Controls ─────────────────────────────────────────────────

function InlineReviewControls({
  instanceId,
  submission,
  onReviewed,
}: {
  instanceId: string;
  submission: SubmissionRow;
  onReviewed: () => void;
}) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReview = async (status: "approved" | "revision_requested") => {
    setSaving(true);
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission_id: submission.id,
          status,
          score: score ? parseInt(score) : undefined,
          feedback: feedback || undefined,
        }),
      });
      if (res.ok) {
        onReviewed();
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-3 border-t border-[var(--border-color)] pt-3">
      {/* Score */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 text-accent" />
          <span className="text-[10px] uppercase tracking-wider text-dim">
            Nota (0-10)
          </span>
        </div>
        <input
          type="number"
          min={0}
          max={10}
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="—"
          className="w-20 px-3 py-1.5 bg-bg-elevated border border-[var(--border-color)] rounded-lg text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all"
        />
      </div>

      {/* Feedback */}
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Deixe um comentario para o participante..."
        rows={2}
        className={`${inputCls} resize-none`}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleReview("approved")}
          disabled={saving}
          className="px-6 py-3 bg-success/10 border-2 border-success/30 text-success rounded-xl text-sm font-semibold hover:bg-success/20 transition-all flex items-center justify-center gap-2 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Aprovar
        </button>
        <button
          onClick={() => handleReview("revision_requested")}
          disabled={saving}
          className="px-6 py-3 bg-warning/10 border-2 border-warning/30 text-warning rounded-xl text-sm font-semibold hover:bg-warning/20 transition-all flex items-center justify-center gap-2 flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          Solicitar Revisao
        </button>
      </div>
    </div>
  );
}

// ─── Participant Avatar ─────────────────────────────────────────────────────

function Avatar({
  name,
  url,
  size = "md",
}: {
  name: string | null;
  url: string | null;
  size?: "sm" | "md";
}) {
  const dims = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (url) {
    return (
      <img
        src={url}
        alt={name || ""}
        className={`${dims} rounded-full object-cover flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dims} rounded-full bg-accent/10 flex items-center justify-center text-accent font-medium flex-shrink-0`}
    >
      {(name || "?")[0].toUpperCase()}
    </div>
  );
}

// ─── Submission Card per Participant ────────────────────────────────────────

function ParticipantSubmissionCard({
  participant,
  submission,
  task,
  instanceId,
  onReviewed,
}: {
  participant: ParticipantRow;
  submission: SubmissionRow | null;
  task: TaskRow;
  instanceId: string;
  onReviewed: () => void;
}) {
  if (!submission) {
    // Pending — participant hasn't submitted yet
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-bg-elevated/30 rounded-xl">
        <Avatar name={participant.userName} url={participant.userAvatar} size="sm" />
        <span className="text-sm text-cream font-medium">
          {participant.userName || "Sem nome"}
        </span>
        <span className="text-xs text-dim ml-auto">Pendente</span>
      </div>
    );
  }

  const isSubmitted = submission.status === "submitted";
  const isApproved = submission.status === "approved";
  const isRevisionRequested = submission.status === "revision_requested";

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-bg-elevated/20 overflow-hidden">
      {/* Participant header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar name={participant.userName} url={participant.userAvatar} size="sm" />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-cream font-medium">
            {participant.userName || "Sem nome"}
          </span>
          <span className="text-[10px] text-dim block">
            Enviado em {fmtDateTime(submission.submittedAt)}
          </span>
        </div>

        {/* Status badge */}
        {isApproved && (
          <div className="flex items-center gap-2">
            {submission.score != null && (
              <span className="text-xs font-semibold text-accent">
                {submission.score}/10
              </span>
            )}
            <Badge variant="success">Aprovado</Badge>
          </div>
        )}
        {isRevisionRequested && (
          <Badge variant="warning">Revisao solicitada</Badge>
        )}
        {isSubmitted && (
          <Badge variant="info">Aguardando revisao</Badge>
        )}
      </div>

      {/* Submission content */}
      <div className="px-4 pb-3">
        <SubmissionContent
          submission={submission}
          taskType={task.taskType}
          config={task.parsedConfig}
        />

        {/* Show review feedback if already reviewed */}
        {isApproved && submission.reviewFeedback && (
          <div className="mt-3 rounded-lg bg-success/5 border border-success/15 p-3">
            <span className="text-[10px] uppercase tracking-wider text-success/70">
              Feedback do mentor
            </span>
            <p className="text-sm text-cream mt-1 whitespace-pre-wrap">
              {submission.reviewFeedback}
            </p>
          </div>
        )}

        {isRevisionRequested && submission.reviewFeedback && (
          <div className="mt-3 rounded-lg bg-warning/5 border border-warning/15 p-3">
            <span className="text-[10px] uppercase tracking-wider text-warning/70">
              Feedback do mentor
            </span>
            <p className="text-sm text-cream mt-1 whitespace-pre-wrap">
              {submission.reviewFeedback}
            </p>
          </div>
        )}

        {/* Inline review controls for submissions awaiting review */}
        {isSubmitted && (
          <InlineReviewControls
            instanceId={instanceId}
            submission={submission}
            onReviewed={onReviewed}
          />
        )}
      </div>
    </div>
  );
}

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({
  task,
  participants,
  submissions,
  instanceId,
  onReviewed,
}: {
  task: TaskRow;
  participants: ParticipantRow[];
  submissions: SubmissionRow[];
  instanceId: string;
  onReviewed: () => void;
}) {
  const taskSubs = submissions.filter((s) => s.taskId === task.id);
  const subsByUser = new Map(taskSubs.map((s) => [s.userId, s]));
  const submittedCount = taskSubs.length;
  const approvedCount = taskSubs.filter((s) => s.status === "approved").length;
  const awaitingCount = taskSubs.filter((s) => s.status === "submitted").length;

  const ttInfo = taskTypeBadge[task.taskType] || taskTypeBadge.text;
  const TypeIcon = ttInfo.icon;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-bg-card p-6 space-y-4">
      {/* Task context block */}
      <div className="space-y-3">
        {/* Name + badges */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-lg font-semibold text-cream leading-tight">
            {task.name}
          </h4>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.isRequired === 1 && (
              <Badge variant="accent" className="text-[10px]">
                Obrigatoria
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-dim leading-relaxed">{task.description}</p>
        )}

        {/* Meta row: type, review type, config hints */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[11px] text-dim bg-bg-elevated px-2 py-0.5 rounded-md">
            <TypeIcon className="w-3 h-3" />
            {ttInfo.label}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-dim bg-bg-elevated px-2 py-0.5 rounded-md">
            Revisao: {reviewTypeBadge[task.reviewType] || task.reviewType}
          </span>
          {task.parsedConfig?.hint && (
            <span className="text-[11px] text-dim italic">
              Dica: {task.parsedConfig.hint}
            </span>
          )}
          {task.parsedConfig?.allowedTypes && (
            <span className="text-[11px] text-dim">
              Tipos aceitos: {task.parsedConfig.allowedTypes.join(", ")}
            </span>
          )}
        </div>

        {/* Progress summary */}
        <div className="flex items-center gap-4 text-[11px] text-dim">
          <span>
            {submittedCount}/{participants.length} submeteram
          </span>
          <span className="text-success">
            {approvedCount} aprovado{approvedCount !== 1 ? "s" : ""}
          </span>
          {awaitingCount > 0 && (
            <span className="text-sage">
              {awaitingCount} aguardando revisao
            </span>
          )}
        </div>
      </div>

      {/* Submissions section */}
      <div className="space-y-2">
        {participants.length === 0 ? (
          <div className="text-center py-6 text-dim text-sm">
            <Clock className="w-5 h-5 mx-auto mb-2 opacity-40" />
            Nenhum participante
          </div>
        ) : submittedCount === 0 ? (
          <div className="text-center py-6 text-dim text-sm">
            <Clock className="w-5 h-5 mx-auto mb-2 opacity-40" />
            Nenhuma submissao recebida
          </div>
        ) : (
          <>
            {/* Show submissions first (awaiting review on top) */}
            {participants
              .filter((p) => subsByUser.has(p.userId))
              .sort((a, b) => {
                const subA = subsByUser.get(a.userId)!;
                const subB = subsByUser.get(b.userId)!;
                // submitted (awaiting) first, then revision_requested, then approved
                const order: Record<string, number> = {
                  submitted: 0,
                  revision_requested: 1,
                  approved: 2,
                };
                return (
                  (order[subA.status] ?? 3) - (order[subB.status] ?? 3)
                );
              })
              .map((p) => (
                <ParticipantSubmissionCard
                  key={p.id}
                  participant={p}
                  submission={subsByUser.get(p.userId) || null}
                  task={task}
                  instanceId={instanceId}
                  onReviewed={onReviewed}
                />
              ))}

            {/* Pending participants */}
            {participants
              .filter((p) => !subsByUser.has(p.userId))
              .map((p) => (
                <ParticipantSubmissionCard
                  key={p.id}
                  participant={p}
                  submission={null}
                  task={task}
                  instanceId={instanceId}
                  onReviewed={onReviewed}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stage Section ──────────────────────────────────────────────────────────

function StageSection({
  stage,
  participants,
  submissions,
  instanceId,
  defaultOpen,
  onReviewed,
}: {
  stage: StageRow;
  participants: ParticipantRow[];
  submissions: SubmissionRow[];
  instanceId: string;
  defaultOpen: boolean;
  onReviewed: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const stageTaskIds = new Set(stage.tasks.map((t) => t.id));
  const stageSubs = submissions.filter((s) => stageTaskIds.has(s.taskId));
  const totalPossible = stage.tasks.length * participants.length;
  const approvedCount = stageSubs.filter((s) => s.status === "approved").length;
  const completedTasks = stage.tasks.filter((task) => {
    const taskSubs = stageSubs.filter((s) => s.taskId === task.id);
    return (
      taskSubs.length === participants.length &&
      taskSubs.every((s) => s.status === "approved")
    );
  }).length;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-bg-card overflow-hidden">
      {/* Stage header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-bg-elevated/30 transition-colors text-left"
      >
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: stage.color || "#C4A882" }}
        />
        <h3 className="text-base font-semibold text-cream flex-1">
          {stage.name}
        </h3>
        <span className="text-xs text-dim">
          {completedTasks}/{stage.tasks.length} tarefa
          {stage.tasks.length !== 1 ? "s" : ""} concluida
          {stage.tasks.length !== 1 ? "s" : ""}
        </span>

        {/* Mini progress */}
        {totalPossible > 0 && (
          <div className="w-16 h-1.5 bg-bg-elevated rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${Math.round((approvedCount / totalPossible) * 100)}%`,
              }}
            />
          </div>
        )}

        {open ? (
          <ChevronDown className="w-4 h-4 text-dim flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-dim flex-shrink-0" />
        )}
      </button>

      {/* Stage content — task cards */}
      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-[var(--border-color)] pt-4">
          {stage.tasks.length === 0 ? (
            <p className="text-sm text-dim text-center py-4">
              Nenhuma tarefa nesta etapa
            </p>
          ) : (
            stage.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                participants={participants}
                submissions={submissions}
                instanceId={instanceId}
                onReviewed={onReviewed}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function InstanceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const journeyId = params.journeyId as string;
  const instanceId = params.instanceId as string;

  const [instance, setInstance] = useState<InstanceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}`);
      if (res.ok) setInstance(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="ml-2 text-sm text-dim">Carregando...</span>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="text-center py-20">
        <p className="text-dim">Instancia nao encontrada.</p>
        <button
          onClick={() => router.push(`/admin/${evalId}/journeys/${journeyId}`)}
          className="mt-4 text-accent hover:underline text-sm"
        >
          Voltar
        </button>
      </div>
    );
  }

  const iStatus =
    instanceStatusBadge[instance.status] || instanceStatusBadge.active;
  const totalTasks = instance.stages.reduce(
    (a, s) => a + s.tasks.length,
    0
  );
  const activeParticipants = instance.participants.filter(
    (p) => p.role === "participant"
  );

  // Overall progress: approved submissions / (totalTasks * participants)
  const totalPossible = totalTasks * activeParticipants.length;
  const totalApproved = instance.submissions.filter(
    (s) => s.status === "approved"
  ).length;
  const overallPercent =
    totalPossible > 0
      ? Math.round((totalApproved / totalPossible) * 100)
      : 0;

  // Determine which stage should be expanded by default (first stage with pending reviews)
  const defaultOpenStageId = (() => {
    for (const stage of instance.stages) {
      const stageTaskIds = new Set(stage.tasks.map((t) => t.id));
      const hasPendingReview = instance.submissions.some(
        (s) => stageTaskIds.has(s.taskId) && s.status === "submitted"
      );
      if (hasPendingReview) return stage.id;
    }
    // If nothing pending, expand first stage
    return instance.stages[0]?.id || null;
  })();

  // Count submissions awaiting review
  const awaitingReview = instance.submissions.filter(
    (s) => s.status === "submitted"
  ).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back link */}
      <button
        onClick={() => router.push(`/admin/${evalId}/journeys/${journeyId}`)}
        className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar aos grupos
      </button>

      {/* Header card */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6">
        <div className="space-y-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {instance.journey && (
                <span className="text-[11px] uppercase tracking-wider text-dim">
                  {instance.journey.name}
                </span>
              )}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-serif text-cream">
                  {instance.name}
                </h1>
                <Badge variant={iStatus.variant}>{iStatus.label}</Badge>
              </div>
            </div>

            {awaitingReview > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-sage/10 border border-sage/20 rounded-xl flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
                <span className="text-xs text-sage font-medium">
                  {awaitingReview} aguardando revisao
                </span>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-dim">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {fmtDate(instance.startDate)}
                {instance.endDate && <> &mdash; {fmtDate(instance.endDate)}</>}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-dim">
              <Users className="w-3.5 h-3.5" />
              <span>
                {activeParticipants.length} participante
                {activeParticipants.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-dim">
              <ListChecks className="w-3.5 h-3.5" />
              <span>
                {totalTasks} tarefa{totalTasks !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-dim">Progresso geral</span>
              <span className="text-[11px] text-cream font-medium">
                {overallPercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stages — task-centric view */}
      <div className="space-y-4">
        {instance.stages.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            participants={activeParticipants}
            submissions={instance.submissions}
            instanceId={instanceId}
            defaultOpen={stage.id === defaultOpenStageId}
            onReviewed={fetchInstance}
          />
        ))}
      </div>
    </div>
  );
}
