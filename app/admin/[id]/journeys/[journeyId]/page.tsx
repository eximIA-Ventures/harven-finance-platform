"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  Loader2,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Trash2,
  Pencil,
  FileText,
  Upload,
  Link2,
  HelpCircle,
  CheckSquare,
  Play,
  ArrowLeft,
  GripVertical,
  Lock,
  Unlock,
  Hand,
  AlignLeft,
  Star,
  Weight,
  Users,
  File,
  Download,
  FolderOpen,
  Eye,
  EyeOff,
  ClipboardList,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type TaskType = "text" | "file" | "link" | "quiz" | "checklist" | "video" | "attendance" | "material";
type ReviewType = "mentor" | "peer" | "ai" | "auto";
type UnlockRule = "sequential" | "parallel" | "manual";

interface TaskRow {
  id: string;
  stageId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  taskType: string;
  isRequired: number;
  reviewType: string;
  config: Record<string, unknown> | null;
  maxScore: number;
  weight: number;
  materialUrl: string | null;
  materialFileName: string | null;
  materialFileSize: number | null;
  isReleased: number;
}

interface StageRow {
  id: string;
  journeyId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  color: string | null;
  estimatedDays: number | null;
  unlockRule: string | null;
  tasks: TaskRow[];
}

interface JourneyFile {
  id: string;
  journeyId: string;
  name: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileType: string | null;
  fileSize: number | null;
  uploadedBy: string | null;
  createdAt: string;
}

interface JourneyDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  journeyType: string | null;
  color: string | null;
  icon: string | null;
  coverImage: string | null;
  status: string | null;
  selfEnroll: number | null;
  estimatedDays: number | null;
  isTemplate: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  stages: StageRow[];
  files: JourneyFile[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  "case-competition": "Case Competition",
  "investment-thesis": "Investment Thesis",
  "trainee-onboarding": "Trainee Onboarding",
  "nucleus-project": "Nucleus Project",
  capacitacao: "Capacitacao",
  custom: "Custom",
};

const typeColors: Record<string, string> = {
  "case-competition": "bg-red-500",
  "investment-thesis": "bg-blue-500",
  "trainee-onboarding": "bg-emerald-500",
  "nucleus-project": "bg-purple-500",
  capacitacao: "bg-teal-500",
  custom: "bg-amber-500",
};

const typeBadgeVariant: Record<string, "warning" | "info" | "success" | "accent" | "default"> = {
  "case-competition": "warning",
  "investment-thesis": "info",
  "trainee-onboarding": "success",
  "nucleus-project": "accent",
  capacitacao: "info",
  custom: "default",
};

const taskTypeLabels: Record<string, string> = {
  text: "Texto",
  file: "Arquivo",
  link: "Link",
  quiz: "Quiz",
  checklist: "Checklist",
  video: "Video",
  attendance: "Presenca",
  material: "Material",
};

const taskTypeIcons: Record<string, typeof FileText> = {
  text: FileText,
  file: Upload,
  link: Link2,
  quiz: HelpCircle,
  checklist: CheckSquare,
  video: Play,
  attendance: Users,
  material: Download,
};

const reviewTypeLabels: Record<string, string> = {
  mentor: "Mentor",
  peer: "Par",
  ai: "IA",
  auto: "Auto",
};

const unlockRuleLabels: Record<string, string> = {
  sequential: "Sequencial",
  parallel: "Paralelo",
  manual: "Manual",
};

const unlockRuleIcons: Record<string, typeof Lock> = {
  sequential: Lock,
  parallel: Unlock,
  manual: Hand,
};

const PRESET_COLORS = [
  "#C4A882",
  "#EF4444",
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
];

const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

// ─── Stage Form ─────────────────────────────────────────────────────────────

interface StageFormState {
  name: string;
  description: string;
  unlock_rule: UnlockRule;
  estimated_days: string;
  color: string;
}

const emptyStageForm: StageFormState = {
  name: "",
  description: "",
  unlock_rule: "sequential",
  estimated_days: "",
  color: "#C4A882",
};

// ─── Task Form ──────────────────────────────────────────────────────────────

interface QuizQuestion {
  id: string;
  question: string;
  questionType: string;
  options: { label: string; text: string }[];
  correctAnswer: string | null;
  sortOrder: number;
  points: number;
}

interface TaskFormState {
  name: string;
  description: string;
  task_type: TaskType;
  review_type: ReviewType;
  is_required: boolean;
  max_score: string;
  weight: string;
  config: Record<string, unknown>;
  material_url: string;
  material_file_name: string;
  material_file_size: number | null;
  is_released: boolean;
}

const emptyTaskForm: TaskFormState = {
  name: "",
  description: "",
  task_type: "text",
  review_type: "mentor",
  is_required: true,
  max_score: "10",
  weight: "1",
  config: {},
  material_url: "",
  material_file_name: "",
  material_file_size: null,
  is_released: true,
};

// ─── Modal Shell ────────────────────────────────────────────────────────────

function ModalShell({
  open,
  onClose,
  headerColor,
  headerTitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  headerColor: string;
  headerTitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/25 backdrop-blur-[6px]"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
        style={{ animation: "modal-fade 0.2s ease-out" }}
      />

      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{
          animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-bg-card rounded-t-2xl border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: headerColor }}
              />
              <h2 className="text-lg font-semibold text-cream truncate max-w-[300px]">
                {headerTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">{children}</div>

          {/* Footer — sticky */}
          <div className="sticky bottom-0 bg-bg-card border-t border-[var(--border-color)] px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
            {footer}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-fade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes modal-scale {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// ─── Add Stage Modal ────────────────────────────────────────────────────────

function AddStageModal({
  open,
  onClose,
  journeyId,
  nextOrder,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  journeyId: string;
  nextOrder: number;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<StageFormState>(emptyStageForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyStageForm);
  }, [open]);

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/journeys/${journeyId}/stages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          unlock_rule: form.unlock_rule,
          estimated_days: form.estimated_days
            ? parseInt(form.estimated_days)
            : null,
          color: form.color,
          sort_order: nextOrder,
        }),
      });
      if (res.ok) {
        onClose();
        onCreated();
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      headerColor={form.color}
      headerTitle={form.name || "Nova Etapa"}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-dim hover:text-cream transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.name || saving}
            className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Criar
          </button>
        </>
      }
    >
      {/* Name */}
      <input
        autoFocus
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nome da etapa"
        className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40"
      />

      {/* Description */}
      <div className="flex items-start gap-3">
        <AlignLeft className="w-4 h-4 mt-2.5 text-accent flex-shrink-0" />
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          placeholder="Adicionar descricao"
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Unlock rule pills */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-dim">
          Regra de desbloqueio
        </span>
        <div className="flex gap-2">
          {(["sequential", "parallel", "manual"] as const).map((r) => {
            const Icon = unlockRuleIcons[r];
            return (
              <button
                key={r}
                onClick={() => setForm({ ...form, unlock_rule: r })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  form.unlock_rule === r
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : "bg-bg-elevated text-dim hover:text-cream"
                }`}
              >
                <Icon className="w-3 h-3" />
                {unlockRuleLabels[r]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Estimated days */}
      <div className="flex items-center gap-3">
        <Clock className="w-4 h-4 text-accent flex-shrink-0" />
        <input
          type="number"
          min={1}
          value={form.estimated_days}
          onChange={(e) =>
            setForm({ ...form, estimated_days: e.target.value })
          }
          placeholder="Dias estimados"
          className={inputCls}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-dim">
          Cor
        </span>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setForm({ ...form, color: c })}
              className={`w-7 h-7 rounded-full transition-all ${
                form.color === c
                  ? "ring-2 ring-offset-2 ring-offset-bg-card ring-accent scale-110"
                  : "hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Add Task Modal ─────────────────────────────────────────────────────────

function AddTaskModal({
  open,
  onClose,
  journeyId,
  stageId,
  nextOrder,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  journeyId: string;
  stageId: string;
  nextOrder: number;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<TaskFormState>(emptyTaskForm);
  const [saving, setSaving] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  useEffect(() => {
    if (open) setForm(emptyTaskForm);
  }, [open]);

  const updateConfig = (key: string, value: unknown) => {
    setForm((f) => ({
      ...f,
      config: { ...f.config, [key]: value },
    }));
  };

  const handleMaterialUpload = async (file: File) => {
    setUploadingMaterial(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload/journey", { method: "POST", body: fd });
      if (!uploadRes.ok) return;
      const { url, fileName, fileSize } = await uploadRes.json();
      setForm((f) => ({ ...f, material_url: url, material_file_name: fileName, material_file_size: fileSize }));
    } catch { /* silent */ }
    finally { setUploadingMaterial(false); }
  };

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/journeys/${journeyId}/stages/${stageId}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            description: form.description || null,
            task_type: form.task_type,
            review_type: form.review_type,
            is_required: form.is_required,
            max_score: form.max_score ? parseInt(form.max_score) : 10,
            weight: form.weight ? parseFloat(form.weight) : 1,
            config:
              Object.keys(form.config).length > 0 ? form.config : null,
            sort_order: nextOrder,
            material_url: form.material_url || null,
            material_file_name: form.material_file_name || null,
            material_file_size: form.material_file_size || null,
            is_released: form.is_released,
          }),
        }
      );
      if (res.ok) {
        onClose();
        onCreated();
      }
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  const taskTypeColorMap: Record<string, string> = {
    text: "#3B82F6", file: "#10B981", link: "#8B5CF6", quiz: "#F59E0B",
    checklist: "#EF4444", video: "#6366F1", attendance: "#EC4899", material: "#0D9488",
  };
  const taskTypeColor = taskTypeColorMap[form.task_type] || "#C4A882";

  const allTaskTypes: TaskType[] = ["material", "video", "quiz", "text", "file", "link", "checklist", "attendance"];

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      headerColor={taskTypeColor}
      headerTitle={form.name || "Nova Tarefa"}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-dim hover:text-cream transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!form.name || saving}
            className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Criar
          </button>
        </>
      }
    >
      {/* Name */}
      <input
        autoFocus
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nome da tarefa"
        className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40"
      />

      {/* Task type pills */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-dim">
          Tipo de tarefa
        </span>
        <div className="flex gap-2 flex-wrap">
          {allTaskTypes.map((t) => {
            const Icon = taskTypeIcons[t] || FileText;
            return (
              <button
                key={t}
                onClick={() =>
                  setForm({ ...form, task_type: t, config: {} })
                }
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  form.task_type === t
                    ? "bg-accent/15 text-accent border border-accent/25"
                    : "bg-bg-elevated text-dim hover:text-cream"
                }`}
              >
                <Icon className="w-3 h-3" />
                {taskTypeLabels[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Review type pills */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider text-dim">
          Tipo de revisao
        </span>
        <div className="flex gap-2 flex-wrap">
          {(["mentor", "peer", "ai", "auto"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setForm({ ...form, review_type: r })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                form.review_type === r
                  ? "bg-accent/15 text-accent border border-accent/25"
                  : "bg-bg-elevated text-dim hover:text-cream"
              }`}
            >
              {reviewTypeLabels[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Required + Released toggles */}
      <div className="flex items-center gap-6">
        <div className="flex items-center justify-between flex-1">
          <span className="text-sm text-cream">Obrigatoria</span>
          <button
            onClick={() => setForm({ ...form, is_required: !form.is_required })}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              form.is_required ? "bg-accent" : "bg-bg-elevated border border-[var(--border-color)]"
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_required ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        <div className="flex items-center justify-between flex-1">
          <span className="text-sm text-cream flex items-center gap-1.5">
            {form.is_released ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Liberada
          </span>
          <button
            onClick={() => setForm({ ...form, is_released: !form.is_released })}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              form.is_released ? "bg-emerald-500" : "bg-bg-elevated border border-[var(--border-color)]"
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.is_released ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="flex items-start gap-3">
        <AlignLeft className="w-4 h-4 mt-2.5 text-accent flex-shrink-0" />
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          placeholder="Adicionar descricao ou instrucoes"
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Material upload — for material, video types */}
      {(form.task_type === "material" || form.task_type === "video") && (
        <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
          <span className="text-[10px] uppercase tracking-wider text-dim">
            {form.task_type === "material" ? "Arquivo do material" : "Video / Arquivo de aula"}
          </span>
          {form.material_url ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-elevated">
              <File className="w-4 h-4 text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-cream truncate">{form.material_file_name}</p>
                {form.material_file_size && (
                  <p className="text-[10px] text-dim">{(form.material_file_size / 1024).toFixed(0)}KB</p>
                )}
              </div>
              <button
                onClick={() => setForm({ ...form, material_url: "", material_file_name: "", material_file_size: null })}
                className="p-1 rounded hover:bg-danger/10 text-dim hover:text-danger transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[var(--border-color)] text-sm text-dim hover:text-cream hover:border-accent/30 transition-colors cursor-pointer">
              {uploadingMaterial ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadingMaterial ? "Enviando..." : "Fazer upload"}
              <input
                type="file"
                className="hidden"
                disabled={uploadingMaterial}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleMaterialUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {form.task_type === "video" && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                Ou cole URL do video
              </label>
              <input
                value={(form.config.video_url as string) || ""}
                onChange={(e) => updateConfig("video_url", e.target.value)}
                placeholder="https://youtube.com/... ou https://vimeo.com/..."
                className={inputCls}
              />
            </div>
          )}
        </div>
      )}

      {/* Config section — dynamic by type */}
      <div className="space-y-3 pt-3 border-t border-[var(--border-color)]">
        <span className="text-[10px] uppercase tracking-wider text-dim">
          Configuracao
        </span>

        {form.task_type === "text" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                Min. caracteres
              </label>
              <input
                type="number"
                min={0}
                value={(form.config.min_length as string) || ""}
                onChange={(e) => updateConfig("min_length", parseInt(e.target.value) || 0)}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                Max. caracteres
              </label>
              <input
                type="number"
                min={0}
                value={(form.config.max_length as string) || ""}
                onChange={(e) => updateConfig("max_length", parseInt(e.target.value) || 0)}
                placeholder="5000"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {form.task_type === "file" && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dim block mb-2">
                Tipos permitidos
              </label>
              <div className="flex gap-2 flex-wrap">
                {["PDF", "DOCX", "XLSX", "PPTX"].map((ft) => {
                  const allowed = (
                    (form.config.allowed_types as string[]) || []
                  ).includes(ft);
                  return (
                    <button
                      key={ft}
                      onClick={() => {
                        const current =
                          (form.config.allowed_types as string[]) || [];
                        updateConfig(
                          "allowed_types",
                          allowed
                            ? current.filter((x) => x !== ft)
                            : [...current, ft]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        allowed
                          ? "bg-accent/15 text-accent border border-accent/25"
                          : "bg-bg-elevated text-dim border border-[var(--border-color)] hover:text-cream"
                      }`}
                    >
                      {ft}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                Tamanho maximo (MB)
              </label>
              <input
                type="number"
                min={1}
                value={(form.config.max_size_mb as string) || ""}
                onChange={(e) => updateConfig("max_size_mb", parseInt(e.target.value) || 10)}
                placeholder="10"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {form.task_type === "link" && (
          <div>
            <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
              Placeholder
            </label>
            <input
              value={(form.config.placeholder as string) || ""}
              onChange={(e) => updateConfig("placeholder", e.target.value)}
              placeholder="https://exemplo.com/..."
              className={inputCls}
            />
          </div>
        )}

        {form.task_type === "quiz" && (
          <p className="text-xs text-dim">
            Crie a tarefa primeiro e depois adicione as questoes diretamente na lista de tarefas.
          </p>
        )}

        {form.task_type === "checklist" && (
          <p className="text-xs text-dim italic">
            Configurar itens em breve
          </p>
        )}

        {form.task_type === "attendance" && (
          <p className="text-xs text-dim">
            Presenca sera registrada automaticamente pelo mentor.
          </p>
        )}

        {(form.task_type === "material" || form.task_type === "video") && !form.material_url && !form.config.video_url && (
          <p className="text-xs text-dim">
            Suba o arquivo acima para disponibilizar aos participantes.
          </p>
        )}
      </div>

      {/* Score + Weight */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
              Nota maxima
            </label>
            <input
              type="number"
              min={1}
              value={form.max_score}
              onChange={(e) =>
                setForm({ ...form, max_score: e.target.value })
              }
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Weight className="w-4 h-4 text-accent flex-shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
              Peso
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.weight}
              onChange={(e) =>
                setForm({ ...form, weight: e.target.value })
              }
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function JourneyBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const journeyId = params.journeyId as string;

  const [journey, setJourney] = useState<JourneyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasInstances, setHasInstances] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set()
  );

  const [redirecting, setRedirecting] = useState(false);

  // Check permissions and redirect participant to their active instance
  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch("/api/journey-instances").then(r => r.ok ? r.json() : []),
    ]).then(([user, instances]) => {
      if (!user) return;
      const perms = user.permissions || [];
      const admin = perms.includes("admin") || perms.includes("manage_eval");
      setIsAdmin(admin);

      const journeyInsts = (instances as Array<{ journeyId: string; status: string; id: string }>)
        .filter(i => i.journeyId === journeyId);
      setHasInstances(journeyInsts.length > 0);

      // Non-admin with active instance → redirect immediately
      if (!admin) {
        const myInstance = journeyInsts.find(i => i.status === "active");
        if (myInstance) {
          setRedirecting(true);
          router.push(`/admin/${evalId}/my-journeys/${myInstance.id}`);
        }
      }
    }).catch(() => {}).finally(() => setAuthReady(true));
  }, [journeyId, evalId, router]);

  // Modal state
  const [showStageModal, setShowStageModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [taskModal, setTaskModal] = useState<{
    open: boolean;
    stageId: string;
    nextOrder: number;
  }>({ open: false, stageId: "", nextOrder: 0 });

  const fetchJourney = useCallback(async () => {
    try {
      const res = await fetch(`/api/journeys/${journeyId}`);
      if (res.ok) {
        const data: JourneyDetail = await res.json();
        setJourney(data);
        // Auto-expand all stages on first load
        if (expandedStages.size === 0 && data.stages.length > 0) {
          setExpandedStages(new Set(data.stages.map((s) => s.id)));
        }
      }
    } catch (err) {
      console.error("Failed to fetch journey:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm("Remover esta etapa e todas as tarefas?")) return;
    try {
      const res = await fetch(
        `/api/journeys/${journeyId}/stages/${stageId}`,
        { method: "DELETE" }
      );
      if (res.ok) fetchJourney();
    } catch (err) {
      console.error("Failed to delete stage:", err);
    }
  };

  const handleDeleteTask = async (stageId: string, taskId: string) => {
    if (!confirm("Remover esta tarefa?")) return;
    try {
      const res = await fetch(
        `/api/journeys/${journeyId}/stages/${stageId}/tasks/${taskId}`,
        { method: "DELETE" }
      );
      if (res.ok) fetchJourney();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  if (loading || !authReady || redirecting) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="ml-2 text-sm text-dim">{redirecting ? "Redirecionando..." : "Carregando jornada..."}</span>
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

  // ─── Participant Read-Only View ─────────────────────────────────────────────
  if (!isAdmin) {
    const totalTasks = journey.stages.reduce((acc, s) => acc + s.tasks.length, 0);
    return (
      <div className="space-y-8 animate-fade-in-up max-w-3xl mx-auto">
        {/* Back */}
        <button onClick={() => router.push(`/admin/${evalId}/journeys`)} className="flex items-center gap-2 text-sm text-dim hover:text-cream transition-colors">
          <ArrowLeft className="w-4 h-4" /> Jornadas
        </button>

        {/* Hero */}
        <div className="text-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ backgroundColor: `${journey.color}20` }}>
            <Play className="w-8 h-8" style={{ color: journey.color || "#C4A882" }} />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-cream">{journey.name}</h1>
            {journey.description && <p className="text-sm text-dim mt-2 max-w-lg mx-auto">{journey.description}</p>}
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-dim">
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" />{journey.stages.length} etapas</span>
            <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" />{totalTasks} tarefas</span>
            {journey.estimatedDays && <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{journey.estimatedDays} dias</span>}
          </div>
          <p className="text-xs text-dim/60">Aguarde ser adicionado a esta jornada pelo administrador.</p>
        </div>

        {/* Roadmap */}
        <div className="space-y-4">
          {journey.stages.map((stage, idx) => (
            <div key={stage.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: stage.color || "#C4A882" }}>
                  {idx + 1}
                </div>
                {idx < journey.stages.length - 1 && <div className="w-0.5 flex-1 my-1 bg-[var(--border-color)]" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <h3 className="text-sm font-semibold text-cream">{stage.name}</h3>
                {stage.description && <p className="text-xs text-dim mt-1">{stage.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-[10px] text-dim">
                  <span>{stage.tasks.length} tarefa{stage.tasks.length !== 1 ? "s" : ""}</span>
                  {stage.estimatedDays && <span>{stage.estimatedDays} dias</span>}
                </div>
                {/* Task list */}
                <div className="mt-3 space-y-1.5">
                  {stage.tasks.map((task) => {
                    const TypeIcon = taskTypeIcons[task.taskType as TaskType] || FileText;
                    return (
                      <div key={task.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-elevated">
                        <TypeIcon className="w-3.5 h-3.5 text-dim flex-shrink-0" />
                        <span className="text-xs text-cream flex-1">{task.name}</span>
                        <Badge variant="default">{taskTypeLabels[task.taskType as TaskType]}</Badge>
                        {task.isRequired === 1 && <span className="text-[9px] text-accent">Obrigatoria</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Admin Builder View ─────────────────────────────────────────────────────

  const jType = journey.journeyType || "custom";

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Back link */}
      <button
        onClick={() => router.push(`/admin/${evalId}/journeys`)}
        className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Jornadas
      </button>

      {/* Journey Header */}
      <div className="bg-bg-card rounded-2xl border border-[var(--border-color)] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: journey.color || "#C4A882" }}
              />
              <h1 className="text-2xl font-serif text-cream">
                {journey.name}
              </h1>
              <Badge variant={typeBadgeVariant[jType] || "default"}>
                {typeLabels[jType] || jType}
              </Badge>
            </div>
            {journey.description && (
              <p className="text-sm text-dim ml-6">{journey.description}</p>
            )}
            <div className="flex items-center gap-4 ml-6 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-dim">
                <Layers className="w-3 h-3" />
                <span>
                  {journey.stages.length} etapa
                  {journey.stages.length !== 1 ? "s" : ""}
                </span>
              </div>
              {journey.estimatedDays && (
                <div className="flex items-center gap-1.5 text-xs text-dim">
                  <Clock className="w-3 h-3" />
                  <span>{journey.estimatedDays} dias</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-dim">
                <FileText className="w-3 h-3" />
                <span>
                  {journey.stages.reduce(
                    (acc, s) => acc + s.tasks.length,
                    0
                  )}{" "}
                  tarefa
                  {journey.stages.reduce(
                    (acc, s) => acc + s.tasks.length,
                    0
                  ) !== 1
                    ? "s"
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  router.push(
                    `/admin/${evalId}/journeys/${journeyId}/responses`
                  )
                }
              >
                <ClipboardList className="w-4 h-4" />
                Respostas
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  router.push(
                    `/admin/${evalId}/journeys/${journeyId}/groups`
                  )
                }
              >
                <Users className="w-4 h-4" />
                Ver Grupos
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  router.push(
                    `/admin/${evalId}/journeys/${journeyId}/start`
                  )
                }
              >
                <Play className="w-4 h-4" />
                {hasInstances ? "Nova Turma" : "Iniciar Jornada"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3">
        {journey.stages.map((stage, stageIdx) => {
          const isExpanded = expandedStages.has(stage.id);
          const UnlockIcon =
            unlockRuleIcons[stage.unlockRule || "sequential"];

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
                {/* Color bar */}
                <div
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: stage.color || "#C4A882",
                  }}
                />

                {/* Expand icon */}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-dim flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-dim flex-shrink-0" />
                )}

                {/* Stage name */}
                <span className="text-sm font-medium text-cream flex-1">
                  {stage.name}
                </span>

                {/* Task count badge */}
                <Badge variant="default">
                  {stage.tasks.length} tarefa
                  {stage.tasks.length !== 1 ? "s" : ""}
                </Badge>

                {/* Estimated days */}
                {stage.estimatedDays && (
                  <span className="text-[11px] text-dim flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stage.estimatedDays}d
                  </span>
                )}

                {/* Unlock rule badge */}
                <Badge variant="info" className="gap-1">
                  <UnlockIcon className="w-3 h-3" />
                  {unlockRuleLabels[stage.unlockRule || "sequential"]}
                </Badge>

                {/* Delete */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStage(stage.id);
                    }}
                    className="p-1.5 rounded hover:bg-danger/10 text-dim hover:text-danger transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Expanded content — tasks */}
              {isExpanded && (
                <div className="border-t border-[var(--border-color)]">
                  {stage.tasks.length === 0 && (
                    <div className="px-6 py-4">
                      <p className="text-xs text-dim italic">
                        Nenhuma tarefa nesta etapa.
                      </p>
                    </div>
                  )}

                  {stage.tasks.map((task) => {
                    const TaskIcon =
                      taskTypeIcons[task.taskType] || FileText;
                    const isReleased = task.isReleased !== 0;
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 px-6 py-3 border-b border-[var(--border-color)] last:border-b-0 hover:bg-bg-elevated/30 transition-colors ${!isReleased ? "opacity-50" : ""}`}
                      >
                        {/* Grip */}
                        {isAdmin && <GripVertical className="w-3.5 h-3.5 text-dim/40 flex-shrink-0" />}

                        {/* Icon */}
                        <TaskIcon className="w-4 h-4 text-dim flex-shrink-0" />

                        {/* Name */}
                        <span className="text-sm text-cream flex-1">
                          {task.name}
                        </span>

                        {/* Material indicator */}
                        {task.materialUrl && (
                          <a href={task.materialUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1 rounded-lg text-dim hover:text-accent hover:bg-accent/10 transition-colors" title={task.materialFileName || "Material"}>
                            <File className="w-3 h-3" />
                          </a>
                        )}

                        {/* Type badge */}
                        <Badge variant="default">
                          {taskTypeLabels[task.taskType] ||
                            task.taskType}
                        </Badge>

                        {/* Review type badge */}
                        <Badge variant="info">
                          {reviewTypeLabels[task.reviewType] ||
                            task.reviewType}
                        </Badge>

                        {/* Required indicator */}
                        {task.isRequired === 1 && (
                          <span className="text-[10px] text-accent font-medium">
                            Obrigatoria
                          </span>
                        )}

                        {/* Release toggle */}
                        {isAdmin && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await fetch(`/api/journeys/${journeyId}/stages/${stage.id}/tasks/${task.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ is_released: !isReleased }),
                              });
                              fetchJourney();
                            }}
                            className={`p-1 rounded transition-colors ${isReleased ? "text-emerald-500 hover:bg-emerald-500/10" : "text-dim hover:bg-bg-elevated"}`}
                            title={isReleased ? "Liberada — clique para bloquear" : "Bloqueada — clique para liberar"}
                          >
                            {isReleased ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </button>
                        )}

                        {/* Delete */}
                        {isAdmin && (
                          <button
                            onClick={() =>
                              handleDeleteTask(stage.id, task.id)
                            }
                            className="p-1 rounded hover:bg-danger/10 text-dim hover:text-danger transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add task button */}
                  {isAdmin && (
                    <div className="px-6 py-3">
                      <button
                        onClick={() =>
                          setTaskModal({
                            open: true,
                            stageId: stage.id,
                            nextOrder: stage.tasks.length,
                          })
                        }
                        className="flex items-center gap-2 text-xs text-accent hover:text-accent-hover transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar Tarefa
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Shared Files Section */}
        {isAdmin && (
          <div className="rounded-xl border border-[var(--border-color)] bg-bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-semibold text-cream">Arquivos Padrão</h3>
                <span className="text-[10px] text-dim">Visíveis para todos os grupos</span>
              </div>
              <label className="px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {uploadingFile ? "Enviando..." : "Upload"}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingFile}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingFile(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      const uploadRes = await fetch("/api/upload/journey", { method: "POST", body: fd });
                      if (!uploadRes.ok) return;
                      const { url, fileName, fileType, fileSize } = await uploadRes.json();
                      await fetch(`/api/journeys/${journeyId}/files`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: file.name.replace(/\.[^.]+$/, ""), fileUrl: url, fileName, fileType, fileSize }),
                      });
                      fetchJourney();
                    } catch { /* silent */ }
                    finally { setUploadingFile(false); e.target.value = ""; }
                  }}
                />
              </label>
            </div>
            {journey.files && journey.files.length > 0 ? (
              <div className="divide-y divide-[var(--border-color)]">
                {journey.files.map(f => (
                  <div key={f.id} className="px-5 py-3 flex items-center gap-3 hover:bg-bg-elevated/50 transition-colors">
                    <File className="w-4 h-4 text-dim shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-cream truncate">{f.name}</p>
                      <p className="text-[10px] text-dim">{f.fileName}{f.fileSize ? ` · ${(f.fileSize / 1024).toFixed(0)}KB` : ""}</p>
                    </div>
                    <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg text-dim hover:text-accent hover:bg-accent/10 transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={async () => {
                        await fetch(`/api/journeys/${journeyId}/files?fileId=${f.id}`, { method: "DELETE" });
                        fetchJourney();
                      }}
                      className="p-1.5 rounded-lg text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-dim text-xs">
                Nenhum arquivo. Suba regulamentos, templates ou materiais de apoio.
              </div>
            )}
          </div>
        )}

        {/* Add stage button */}
        {isAdmin && (
          <button
            onClick={() => setShowStageModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[var(--border-color)] text-sm text-dim hover:text-cream hover:border-accent/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Etapa
          </button>
        )}
      </div>

      {/* Modals */}
      <AddStageModal
        open={showStageModal}
        onClose={() => setShowStageModal(false)}
        journeyId={journeyId}
        nextOrder={journey.stages.length}
        onCreated={fetchJourney}
      />

      <AddTaskModal
        open={taskModal.open}
        onClose={() =>
          setTaskModal({ open: false, stageId: "", nextOrder: 0 })
        }
        journeyId={journeyId}
        stageId={taskModal.stageId}
        nextOrder={taskModal.nextOrder}
        onCreated={fetchJourney}
      />
    </div>
  );
}
