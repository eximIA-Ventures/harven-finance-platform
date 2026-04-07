"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Calendar,
  ChevronRight,
  GripVertical,
  Link2,
  X,
  Pencil,
  Check,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface KanbanCard {
  id: string;
  instanceId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigneeId: string | null;
  stageId: string | null;
  dueDate: string | null;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assigneeName: string | null;
  assigneeAvatar: string | null;
}

interface Participant {
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  role: string;
}

interface Stage {
  id: string;
  name: string;
  color: string | null;
}

interface KanbanColumn {
  key: string;
  label: string;
  color: string;
}

interface InstanceData {
  id: string;
  name: string;
  metadata: string | null;
  journey: { name: string } | null;
  participants: Participant[];
  stages: Stage[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { key: "todo", label: "A Fazer", color: "#6B7280" },
  { key: "doing", label: "Em Andamento", color: "#3B82F6" },
  { key: "review", label: "Revisao", color: "#F59E0B" },
  { key: "done", label: "Concluido", color: "#10B981" },
];

const COLUMN_COLORS = [
  "#6B7280",
  "#3B82F6",
  "#8B5CF6",
  "#F59E0B",
  "#10B981",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
];

const PRIORITIES: {
  key: string;
  label: string;
  color: string;
  border: string;
}[] = [
  { key: "low", label: "Baixa", color: "bg-dim/20 text-dim", border: "#6B7280" },
  { key: "medium", label: "Media", color: "bg-blue-500/15 text-blue-400", border: "#3B82F6" },
  { key: "high", label: "Alta", color: "bg-amber-500/15 text-amber-400", border: "#F59E0B" },
  { key: "urgent", label: "Urgente", color: "bg-red-500/15 text-red-400", border: "#EF4444" },
];

const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

function getPriorityConfig(priority: string) {
  return PRIORITIES.find((p) => p.key === priority) || PRIORITIES[1];
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function isOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === "done") return false;
  return new Date(dueDate) < new Date();
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function KanbanBoardPage() {
  const params = useParams();
  const router = useRouter();
  const evalId = params.id as string;
  const instanceId = params.instanceId as string;

  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [instance, setInstance] = useState<InstanceData | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Column management
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const addColumnRef = useRef<HTMLInputElement>(null);

  // ─── Parse columns from metadata ──────────────────────────────────────

  const parseColumnsFromMetadata = useCallback((metadata: string | null): KanbanColumn[] => {
    if (!metadata) return DEFAULT_COLUMNS;
    try {
      const parsed = JSON.parse(metadata);
      if (parsed.kanbanColumns && Array.isArray(parsed.kanbanColumns) && parsed.kanbanColumns.length > 0) {
        return parsed.kanbanColumns;
      }
    } catch {
      /* silent */
    }
    return DEFAULT_COLUMNS;
  }, []);

  // ─── Save columns to backend ─────────────────────────────────────────

  const saveColumns = useCallback(
    async (newColumns: KanbanColumn[]) => {
      // Merge with existing metadata
      let existingMeta: Record<string, unknown> = {};
      if (instance?.metadata) {
        try {
          existingMeta = JSON.parse(instance.metadata);
        } catch {
          /* silent */
        }
      }
      const updatedMeta = { ...existingMeta, kanbanColumns: newColumns };
      const metadataStr = JSON.stringify(updatedMeta);

      try {
        await fetch(`/api/journey-instances/${instanceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadata: metadataStr }),
        });
        // Update local instance metadata
        if (instance) {
          setInstance({ ...instance, metadata: metadataStr });
        }
      } catch {
        /* silent */
      }
    },
    [instanceId, instance]
  );

  // ─── Fetch data ─────────────────────────────────────────────────────

  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}/kanban`);
      if (res.ok) {
        const data: KanbanCard[] = await res.json();
        setCards(data);
      }
    } catch {
      /* silent */
    }
  }, [instanceId]);

  const fetchInstance = useCallback(async () => {
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}`);
      if (res.ok) {
        const data = await res.json();
        const inst: InstanceData = {
          id: data.id,
          name: data.name,
          metadata: data.metadata || null,
          journey: data.journey,
          participants: (data.participants || []).map(
            (p: Record<string, unknown>) => ({
              userId: p.userId as string,
              userName: p.userName as string | null,
              userAvatar: p.userAvatar as string | null,
              role: p.role as string,
            })
          ),
          stages: (data.stages || []).map((s: Record<string, unknown>) => ({
            id: s.id as string,
            name: s.name as string,
            color: s.color as string | null,
          })),
        };
        setInstance(inst);
        setColumns(parseColumnsFromMetadata(inst.metadata));
      }
    } catch {
      /* silent */
    }
  }, [instanceId, parseColumnsFromMetadata]);

  useEffect(() => {
    Promise.all([fetchCards(), fetchInstance()]).finally(() => setLoading(false));
  }, [fetchCards, fetchInstance]);

  useEffect(() => {
    if (addingColumn && addColumnRef.current) {
      addColumnRef.current.focus();
    }
  }, [addingColumn]);

  // ─── Column mutations ─────────────────────────────────────────────────

  const handleAddColumn = async () => {
    const trimmed = newColumnName.trim();
    if (!trimmed) return;
    const key = slugify(trimmed) || `col-${Date.now()}`;
    // Avoid duplicate keys
    if (columns.some((c) => c.key === key)) return;
    const newCol: KanbanColumn = {
      key,
      label: trimmed,
      color: COLUMN_COLORS[columns.length % COLUMN_COLORS.length],
    };
    const updated = [...columns, newCol];
    setColumns(updated);
    setNewColumnName("");
    setAddingColumn(false);
    await saveColumns(updated);
  };

  const handleRenameColumn = async (key: string, newLabel: string) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    const updated = columns.map((c) => (c.key === key ? { ...c, label: trimmed } : c));
    setColumns(updated);
    await saveColumns(updated);
  };

  const handleRemoveColumn = async (key: string) => {
    if (columns.length <= 1) return;
    const firstKey = columns.find((c) => c.key !== key)?.key;
    if (!firstKey) return;
    // Move cards from removed column to first column
    const affectedCards = cards.filter((c) => c.status === key);
    if (affectedCards.length > 0) {
      const ok = confirm(
        `Essa coluna tem ${affectedCards.length} tarefa(s). Elas serao movidas para "${columns.find((c) => c.key === firstKey)?.label}". Continuar?`
      );
      if (!ok) return;
      // Move cards optimistically
      setCards((prev) =>
        prev.map((c) => (c.status === key ? { ...c, status: firstKey } : c))
      );
      // Update cards on backend
      await Promise.all(
        affectedCards.map((card) =>
          fetch(`/api/journey-instances/${instanceId}/kanban/${card.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: firstKey }),
          })
        )
      );
    } else {
      const ok = confirm("Remover esta coluna?");
      if (!ok) return;
    }
    const updated = columns.filter((c) => c.key !== key);
    setColumns(updated);
    await saveColumns(updated);
  };

  const handleChangeColumnColor = async (key: string, color: string) => {
    const updated = columns.map((c) => (c.key === key ? { ...c, color } : c));
    setColumns(updated);
    await saveColumns(updated);
  };

  // ─── Card mutations ─────────────────────────────────────────────────────

  const createCard = async (title: string, status: string) => {
    try {
      const res = await fetch(`/api/journey-instances/${instanceId}/kanban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, status }),
      });
      if (res.ok) await fetchCards();
    } catch {
      /* silent */
    }
  };

  const updateCard = async (cardId: string, updates: Record<string, unknown>) => {
    try {
      const res = await fetch(
        `/api/journey-instances/${instanceId}/kanban/${cardId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (res.ok) await fetchCards();
    } catch {
      /* silent */
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const res = await fetch(
        `/api/journey-instances/${instanceId}/kanban/${cardId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== cardId));
        if (expandedCardId === cardId) setExpandedCardId(null);
      }
    } catch {
      /* silent */
    }
  };

  // ─── Drag and drop ────────────────────────────────────────────────────

  const handleDrop = async (targetStatus: string) => {
    setDragOverCol(null);
    if (!dragCardId) return;
    const card = cards.find((c) => c.id === dragCardId);
    if (!card || card.status === targetStatus) {
      setDragCardId(null);
      return;
    }
    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === dragCardId ? { ...c, status: targetStatus } : c))
    );
    setDragCardId(null);
    await updateCard(dragCardId, { status: targetStatus });
  };

  // ─── Helper: get next column status ───────────────────────────────────

  const getNextStatus = (current: string): string | null => {
    const idx = columns.findIndex((c) => c.key === current);
    return idx >= 0 && idx < columns.length - 1 ? columns[idx + 1].key : null;
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
        <span className="ml-2 text-sm text-dim">Carregando kanban...</span>
      </div>
    );
  }

  const instanceName = instance?.name || "Jornada";
  const participants = instance?.participants || [];
  const stages = instance?.stages || [];

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              router.push(`/admin/${evalId}/my-journeys/${instanceId}`)
            }
            className="flex items-center gap-1.5 text-sm text-dim hover:text-cream transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tarefas
          </button>
          <span className="text-dim/30">/</span>
          <h1 className="text-lg font-serif text-cream">
            Quadro de Tarefas
          </h1>
          <span className="text-dim/40 text-sm hidden sm:inline">
            {instanceName}
          </span>
        </div>

        {/* Participant avatars */}
        {participants.length > 0 && (
          <div className="flex items-center -space-x-2">
            {participants.slice(0, 6).map((p) => (
              <div
                key={p.userId}
                className="w-7 h-7 rounded-full bg-bg-elevated border-2 border-[var(--bg-card)] flex items-center justify-center text-[10px] font-semibold text-cream overflow-hidden"
                title={p.userName || ""}
              >
                {p.userAvatar ? (
                  <img
                    src={p.userAvatar}
                    alt={p.userName || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(p.userName)
                )}
              </div>
            ))}
            {participants.length > 6 && (
              <div className="w-7 h-7 rounded-full bg-accent/15 border-2 border-[var(--bg-card)] flex items-center justify-center text-[10px] font-semibold text-accent">
                +{participants.length - 6}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const columnCards = cards.filter((c) => c.status === col.key);

          return (
            <KanbanColumnComponent
              key={col.key}
              column={col}
              cards={columnCards}
              columns={columns}
              participants={participants}
              stages={stages}
              expandedCardId={expandedCardId}
              onToggleExpand={(id) =>
                setExpandedCardId((prev) => (prev === id ? null : id))
              }
              onCreateCard={createCard}
              onUpdateCard={updateCard}
              onDeleteCard={deleteCard}
              isDragOver={dragOverCol === col.key}
              onDragStart={setDragCardId}
              onDragOver={() => setDragOverCol(col.key)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(col.key)}
              onRenameColumn={handleRenameColumn}
              onRemoveColumn={handleRemoveColumn}
              onChangeColor={handleChangeColumnColor}
              getNextStatus={getNextStatus}
              canRemove={columns.length > 1}
            />
          );
        })}

        {/* Add column button */}
        {addingColumn ? (
          <div className="flex-shrink-0 w-[280px] flex flex-col bg-bg-elevated rounded-xl border-2 border-dashed border-accent/30 p-4">
            <input
              ref={addColumnRef}
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddColumn();
                if (e.key === "Escape") {
                  setAddingColumn(false);
                  setNewColumnName("");
                }
              }}
              placeholder="Nome da coluna..."
              className={inputCls}
            />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
                className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Criar
              </button>
              <button
                onClick={() => {
                  setAddingColumn(false);
                  setNewColumnName("");
                }}
                className="px-3 py-1.5 text-dim hover:text-cream text-xs transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className="flex-shrink-0 w-[280px] min-h-[200px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border-color)] hover:border-accent/30 text-dim hover:text-cream transition-all group"
          >
            <Plus className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity">
              Adicionar Coluna
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Column Component ───────────────────────────────────────────────────────

function KanbanColumnComponent({
  column,
  cards,
  columns,
  participants,
  stages,
  expandedCardId,
  onToggleExpand,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRenameColumn,
  onRemoveColumn,
  onChangeColor,
  getNextStatus,
  canRemove,
}: {
  column: KanbanColumn;
  cards: KanbanCard[];
  columns: KanbanColumn[];
  participants: Participant[];
  stages: Stage[];
  expandedCardId: string | null;
  onToggleExpand: (id: string) => void;
  onCreateCard: (title: string, status: string) => Promise<void>;
  onUpdateCard: (id: string, updates: Record<string, unknown>) => Promise<void>;
  onDeleteCard: (id: string) => Promise<void>;
  isDragOver: boolean;
  onDragStart: (cardId: string) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onRenameColumn: (key: string, newLabel: string) => Promise<void>;
  onRemoveColumn: (key: string) => Promise<void>;
  onChangeColor: (key: string, color: string) => Promise<void>;
  getNextStatus: (current: string) => string | null;
  canRemove: boolean;
}) {
  const [showNewInput, setShowNewInput] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Inline rename state
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(column.label);
  const editRef = useRef<HTMLInputElement>(null);

  // Color picker
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (showNewInput && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [showNewInput]);

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editing]);

  const handleCreate = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setCreating(true);
    await onCreateCard(trimmed, column.key);
    setNewTitle("");
    setShowNewInput(false);
    setCreating(false);
  };

  const handleRenameSubmit = async () => {
    const trimmed = editLabel.trim();
    if (trimmed && trimmed !== column.label) {
      await onRenameColumn(column.key, trimmed);
    } else {
      setEditLabel(column.label);
    }
    setEditing(false);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={`flex-shrink-0 min-w-[280px] w-[280px] flex flex-col bg-bg-elevated rounded-xl border-2 transition-all duration-200 ${
        isDragOver
          ? "border-accent/50 shadow-[0_0_20px_rgba(var(--accent-rgb,99,102,241),0.15)]"
          : "border-[var(--border-color)]"
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] group/header">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Color dot — click to change */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-transparent hover:ring-white/20 transition-all cursor-pointer"
              style={{ backgroundColor: column.color }}
              title="Mudar cor"
            />
            {showColorPicker && (
              <div className="absolute top-6 left-0 z-50 bg-bg-card border border-[var(--border-color)] rounded-lg p-2 shadow-xl flex gap-1.5 flex-wrap w-[120px]">
                {COLUMN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onChangeColor(column.key, c);
                      setShowColorPicker(false);
                    }}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-125 ${
                      c === column.color
                        ? "ring-2 ring-white/50 ring-offset-1 ring-offset-[var(--bg-card)]"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Label — double-click to rename */}
          {editing ? (
            <input
              ref={editRef}
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setEditLabel(column.label);
                  setEditing(false);
                }
              }}
              className="text-sm font-semibold text-cream bg-transparent border-b border-accent/40 focus:outline-none focus:border-accent py-0 px-0 w-full"
            />
          ) : (
            <h3
              className="text-sm font-semibold text-cream truncate cursor-default"
              onDoubleClick={() => {
                setEditLabel(column.label);
                setEditing(true);
              }}
              title="Duplo clique para renomear"
            >
              {column.label}
            </h3>
          )}

          {/* Count badge */}
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              backgroundColor: column.color + "18",
              color: column.color,
            }}
          >
            {cards.length}
          </span>
        </div>

        {/* Column actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
          <button
            onClick={() => {
              setEditLabel(column.label);
              setEditing(true);
            }}
            className="p-1 text-dim hover:text-cream transition-colors rounded"
            title="Renomear"
          >
            <Pencil className="w-3 h-3" />
          </button>
          {canRemove && (
            <button
              onClick={() => onRemoveColumn(column.key)}
              className="p-1 text-dim hover:text-red-400 transition-colors rounded"
              title="Remover coluna"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px] max-h-[calc(100vh-260px)]">
        {cards.map((card) => (
          <div
            key={card.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              onDragStart(card.id);
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <KanbanCardComponent
              card={card}
              columnColor={column.color}
              isExpanded={expandedCardId === card.id}
              onToggleExpand={() => onToggleExpand(card.id)}
              participants={participants}
              stages={stages}
              columns={columns}
              onUpdate={(updates) => onUpdateCard(card.id, updates)}
              onDelete={() => onDeleteCard(card.id)}
              getNextStatus={getNextStatus}
            />
          </div>
        ))}

        {cards.length === 0 && !showNewInput && (
          <div className="flex items-center justify-center py-10 border-2 border-dashed border-[var(--border-color)] rounded-lg opacity-50">
            <span className="text-[11px] text-dim">Arraste tarefas aqui</span>
          </div>
        )}

        {/* Inline new card input */}
        {showNewInput && (
          <div className="bg-bg-card rounded-lg border border-accent/30 p-2.5 space-y-2 shadow-lg">
            <input
              ref={newInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setShowNewInput(false);
                  setNewTitle("");
                }
              }}
              placeholder="Titulo da tarefa..."
              className={inputCls}
              disabled={creating}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
              >
                {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                Criar
              </button>
              <button
                onClick={() => {
                  setShowNewInput(false);
                  setNewTitle("");
                }}
                className="px-3 py-1.5 text-dim hover:text-cream text-xs transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add card button */}
      {!showNewInput && (
        <button
          onClick={() => setShowNewInput(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs text-dim hover:text-cream hover:bg-bg-card/50 transition-all border-t border-[var(--border-color)] rounded-b-xl"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar tarefa
        </button>
      )}
    </div>
  );
}

// ─── Card Component ─────────────────────────────────────────────────────────

function KanbanCardComponent({
  card,
  columnColor,
  isExpanded,
  onToggleExpand,
  participants,
  stages,
  columns,
  onUpdate,
  onDelete,
  getNextStatus,
}: {
  card: KanbanCard;
  columnColor: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  participants: Participant[];
  stages: Stage[];
  columns: KanbanColumn[];
  onUpdate: (updates: Record<string, unknown>) => Promise<void>;
  onDelete: () => Promise<void>;
  getNextStatus: (current: string) => string | null;
}) {
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(
    card.description || ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const priorityCfg = getPriorityConfig(card.priority);
  const nextStatus = getNextStatus(card.status);
  const overdue = isOverdue(card.dueDate, card.status);

  const stageName = stages.find((s) => s.id === card.stageId)?.name || null;

  const handleSaveInline = async (field: string, value: unknown) => {
    setSaving(true);
    await onUpdate({ [field]: value });
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  };

  const isDoneColumn =
    columns.length > 0 && card.status === columns[columns.length - 1].key;

  const descriptionPreview =
    card.description && card.description.length > 0
      ? card.description.length > 60
        ? card.description.slice(0, 60) + "..."
        : card.description
      : null;

  return (
    <div
      className={`bg-bg-card rounded-lg border border-[var(--border-color)] shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 group overflow-hidden ${
        isDoneColumn ? "opacity-70" : ""
      }`}
      style={{ borderLeftWidth: "2px", borderLeftColor: priorityCfg.border }}
    >
      {/* Card compact view */}
      <button
        onClick={onToggleExpand}
        className="w-full text-left px-4 py-3 space-y-2"
      >
        <div className="flex items-start gap-2">
          <GripVertical className="w-3.5 h-3.5 text-dim/20 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-cream leading-tight block">
              {card.title}
            </span>
            {descriptionPreview && (
              <span className="text-[11px] text-dim/60 leading-snug mt-1 block line-clamp-1">
                {descriptionPreview}
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap pl-5">
          {/* Priority pill */}
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${priorityCfg.color}`}
          >
            {priorityCfg.label}
          </span>

          {/* Due date */}
          {card.dueDate && (
            <span
              className={`flex items-center gap-1 text-[10px] ${
                overdue
                  ? "text-red-400 font-semibold"
                  : "text-dim"
              }`}
            >
              <Calendar className="w-3 h-3" />
              {overdue ? "Atrasado" : formatDate(card.dueDate)}
            </span>
          )}

          {/* Stage link */}
          {stageName && (
            <span className="flex items-center gap-1 text-[10px] text-accent/70">
              <Link2 className="w-3 h-3" />
              {stageName}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Assignee avatar */}
          {card.assigneeId && (
            <div
              className="w-5 h-5 rounded-full bg-bg-elevated flex items-center justify-center text-[8px] font-semibold text-cream overflow-hidden ring-1 ring-[var(--border-color)]"
              title={card.assigneeName || ""}
            >
              {card.assigneeAvatar ? (
                <img
                  src={card.assigneeAvatar}
                  alt={card.assigneeName || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(card.assigneeName)
              )}
            </div>
          )}
        </div>
      </button>

      {/* Expanded card detail */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-[var(--border-color)] pt-3">
          {/* Editable title */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-dim mb-1 block">
              Titulo
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => {
                if (editTitle.trim() && editTitle !== card.title) {
                  handleSaveInline("title", editTitle.trim());
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className={inputCls}
            />
          </div>

          {/* Editable description */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-dim mb-1 block">
              Descricao
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              onBlur={() => {
                if (editDescription !== (card.description || "")) {
                  handleSaveInline("description", editDescription || null);
                }
              }}
              placeholder="Adicionar descricao..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Status change */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-dim mb-1 block">
              Status
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {columns.map((col) => (
                <button
                  key={col.key}
                  onClick={() => handleSaveInline("status", col.key)}
                  disabled={saving}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    card.status === col.key
                      ? "bg-accent/15 text-accent border border-accent/25"
                      : "bg-bg-elevated text-dim hover:text-cream border border-transparent hover:border-[var(--border-color)]"
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: col.color }}
                  />
                  {col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-dim mb-1 block">
              Prioridade
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => handleSaveInline("priority", p.key)}
                  disabled={saving}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    card.priority === p.key
                      ? `${p.color} border border-current/25`
                      : "bg-bg-elevated text-dim hover:text-cream border border-transparent hover:border-[var(--border-color)]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-dim mb-1 block">
              Responsavel
            </label>
            <select
              value={card.assigneeId || ""}
              onChange={(e) =>
                handleSaveInline("assignee_id", e.target.value || null)
              }
              className={inputCls}
            >
              <option value="">Nenhum</option>
              {participants.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.userName || p.userId}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-dim mb-1 block">
              Data limite
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={card.dueDate?.split("T")[0] || ""}
                onChange={(e) =>
                  handleSaveInline(
                    "due_date",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null
                  )
                }
                className={inputCls}
              />
              {card.dueDate && (
                <button
                  onClick={() => handleSaveInline("due_date", null)}
                  className="p-1.5 text-dim hover:text-red-400 transition-colors"
                  title="Remover data"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Stage link */}
          {stages.length > 0 && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-dim mb-1 block">
                Etapa vinculada
              </label>
              <select
                value={card.stageId || ""}
                onChange={(e) =>
                  handleSaveInline("stage_id", e.target.value || null)
                }
                className={inputCls}
              >
                <option value="">Nenhuma</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick move + Delete */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
            {nextStatus ? (
              <button
                onClick={() => handleSaveInline("status", nextStatus)}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-all disabled:opacity-40"
              >
                <Check className="w-3 h-3" />
                Mover para{" "}
                {columns.find((c) => c.key === nextStatus)?.label}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[10px] text-green-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                Concluido
              </span>
            )}

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-2 py-1.5 text-dim hover:text-red-400 text-xs transition-colors disabled:opacity-40"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Excluir
            </button>
          </div>

          {saving && (
            <div className="flex items-center gap-1.5 text-[10px] text-accent">
              <Loader2 className="w-3 h-3 animate-spin" />
              Salvando...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
