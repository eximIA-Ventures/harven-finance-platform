"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Search,
  User,
  Clock,
  Plus,
  X,
  Pencil,
  Trash2,
  Save,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  GitBranch,
  Link2,
  ExternalLink,
  Download,
  Upload,
  File,
  Tag,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ResourceType = "article" | "template" | "file" | "link";
type Category = "guides" | "templates" | "processes" | "references";
type CategoryFilter = "all" | Category;

interface WikiResource {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  category: string | null;
  resourceType: string | null;
  authorId: string | null;
  authorName: string | null;
  isPublished: number | null;
  sortOrder: number | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  externalUrl: string | null;
  coverColor: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: "article", label: "Artigo" },
  { value: "template", label: "Template" },
  { value: "file", label: "Arquivo" },
  { value: "link", label: "Link" },
];

const CATEGORIES: { value: Category; label: string; icon: typeof BookOpen }[] = [
  { value: "guides", label: "Guias", icon: BookOpen },
  { value: "templates", label: "Templates", icon: FileSpreadsheet },
  { value: "processes", label: "Processos", icon: GitBranch },
  { value: "references", label: "Referencias", icon: Link2 },
];

const CATEGORY_FILTERS: { value: CategoryFilter; label: string; icon?: typeof BookOpen }[] = [
  { value: "all", label: "Todos" },
  { value: "guides", label: "Guias", icon: BookOpen },
  { value: "templates", label: "Templates", icon: FileSpreadsheet },
  { value: "processes", label: "Processos", icon: GitBranch },
  { value: "references", label: "Referencias", icon: Link2 },
];

const COVER_COLORS = [
  "#C4A882",
  "#6B8F71",
  "#7B8CDE",
  "#D4726A",
  "#D4A843",
  "#8B7EC8",
];

const categoryBadgeVariant: Record<string, "default" | "info" | "accent" | "warning" | "success"> = {
  guides: "info",
  templates: "accent",
  processes: "warning",
  references: "default",
};

const categoryLabel: Record<string, string> = {
  guides: "Guias",
  templates: "Templates",
  processes: "Processos",
  references: "Referencias",
};

const FILE_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  pdf: { bg: "bg-red-500/15", text: "text-red-400" },
  xlsx: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  xls: { bg: "bg-emerald-500/15", text: "text-emerald-400" },
  docx: { bg: "bg-blue-500/15", text: "text-blue-400" },
  doc: { bg: "bg-blue-500/15", text: "text-blue-400" },
  pptx: { bg: "bg-orange-500/15", text: "text-orange-400" },
  ppt: { bg: "bg-orange-500/15", text: "text-orange-400" },
  png: { bg: "bg-purple-500/15", text: "text-purple-400" },
  jpg: { bg: "bg-purple-500/15", text: "text-purple-400" },
  webp: { bg: "bg-purple-500/15", text: "text-purple-400" },
};

function getFileTypeStyle(type: string | null) {
  if (!type) return { bg: "bg-zinc-500/15", text: "text-zinc-400" };
  return FILE_TYPE_COLORS[type.toLowerCase()] || { bg: "bg-zinc-500/15", text: "text-zinc-400" };
}

/* ------------------------------------------------------------------ */
/*  File Upload Dropzone                                               */
/* ------------------------------------------------------------------ */

function FileDropzone({
  onUploaded,
  currentFile,
  onRemove,
}: {
  onUploaded: (url: string, name: string, type: string) => void;
  currentFile: { url: string; name: string; type: string } | null;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/journey", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        onUploaded(data.url, data.fileName, data.fileType);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (currentFile) {
    const style = getFileTypeStyle(currentFile.type);
    return (
      <div className="flex items-center gap-3 p-3 bg-bg-elevated border border-[var(--border-color)] rounded-xl">
        <div className={`p-2 rounded-lg ${style.bg}`}>
          <File className={`w-5 h-5 ${style.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-cream truncate">{currentFile.name}</p>
          <p className="text-xs text-dim uppercase">{currentFile.type}</p>
        </div>
        <button type="button" onClick={onRemove} className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
        dragOver
          ? "border-accent/60 bg-accent/5"
          : "border-[var(--border-color)] hover:border-accent/30 bg-bg-elevated/50"
      }`}
    >
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading ? (
        <div className="text-sm text-dim">Enviando...</div>
      ) : (
        <>
          <Upload className="w-6 h-6 text-dim" />
          <p className="text-sm text-dim">Arraste um arquivo ou clique para selecionar</p>
          <p className="text-xs text-dim/60">PDF, DOCX, XLSX, PPTX, JPG, PNG (max 50MB)</p>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tags Input                                                         */
/* ------------------------------------------------------------------ */

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        onChange([...tags, val]);
      }
      setInput("");
    }
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="hover:text-cream transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim pointer-events-none" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicionar tag e pressionar Enter"
          className={`${inputCls} pl-9`}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create / Edit Modal                                                */
/* ------------------------------------------------------------------ */

interface ModalForm {
  title: string;
  resourceType: ResourceType;
  category: Category;
  content: string;
  tags: string[];
  coverColor: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  externalUrl: string;
}

const emptyForm: ModalForm = {
  title: "",
  resourceType: "article",
  category: "guides",
  content: "",
  tags: [],
  coverColor: COVER_COLORS[0],
  fileUrl: "",
  fileName: "",
  fileType: "",
  externalUrl: "",
};

function ResourceModal({
  open,
  onClose,
  onSaved,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: WikiResource | null;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<ModalForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset/populate form when opening
  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          title: editing.title,
          resourceType: (editing.resourceType as ResourceType) || "article",
          category: (editing.category as Category) || "guides",
          content: editing.content || "",
          tags: editing.tags || [],
          coverColor: editing.coverColor || COVER_COLORS[0],
          fileUrl: editing.fileUrl || "",
          fileName: editing.fileName || "",
          fileType: editing.fileType || "",
          externalUrl: editing.externalUrl || "",
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        category: form.category,
        resource_type: form.resourceType,
        content: form.content,
        cover_color: form.coverColor,
        tags: form.tags.length > 0 ? form.tags : null,
        file_url: form.fileUrl || null,
        file_name: form.fileName || null,
        file_type: form.fileType || null,
        external_url: form.externalUrl || null,
      };

      const url = editing ? `/api/wiki/${editing.id}` : "/api/wiki";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onClose();
        onSaved();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const isFileType = form.resourceType === "template" || form.resourceType === "file";
  const isLink = form.resourceType === "link";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
        style={{ animation: "modal-fade 0.2s ease-out" }}
      />

      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <form onSubmit={handleSubmit}>
          <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)]">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-bg-card rounded-t-2xl border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: form.coverColor }}
                />
                <h2 className="text-lg font-semibold text-cream truncate max-w-[300px]">
                  {form.title || (editing ? "Editar Recurso" : "Novo Recurso")}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Resource type pills */}
              <div>
                <label className="text-xs text-dim font-medium uppercase tracking-wider mb-2 block">
                  Tipo de recurso
                </label>
                <div className="flex gap-2 flex-wrap">
                  {RESOURCE_TYPES.map((rt) => (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => setForm({ ...form, resourceType: rt.value })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        form.resourceType === rt.value
                          ? "bg-accent text-[#0A0A0A]"
                          : "bg-bg-elevated text-dim hover:text-cream"
                      }`}
                    >
                      {rt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titulo do recurso"
                className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40"
                required
              />

              {/* Category pills */}
              <div>
                <label className="text-xs text-dim font-medium uppercase tracking-wider mb-2 block">
                  Categoria
                </label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat.value })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all inline-flex items-center gap-1.5 ${
                          form.category === cat.value
                            ? "bg-accent text-[#0A0A0A]"
                            : "bg-bg-elevated text-dim hover:text-cream"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional fields based on resource type */}
              {form.resourceType === "article" && (
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-dim pointer-events-none" />
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={8}
                    placeholder="Escreva o conteudo do artigo..."
                    className={`${inputCls} pl-9 resize-none`}
                  />
                </div>
              )}

              {isFileType && (
                <>
                  <FileDropzone
                    currentFile={
                      form.fileUrl
                        ? { url: form.fileUrl, name: form.fileName, type: form.fileType }
                        : null
                    }
                    onUploaded={(url, name, type) =>
                      setForm({ ...form, fileUrl: url, fileName: name, fileType: type })
                    }
                    onRemove={() =>
                      setForm({ ...form, fileUrl: "", fileName: "", fileType: "" })
                    }
                  />
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={3}
                    placeholder="Descricao do arquivo (opcional)"
                    className={`${inputCls} resize-none`}
                  />
                </>
              )}

              {isLink && (
                <>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />
                    <input
                      value={form.externalUrl}
                      onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                      placeholder="https://..."
                      className={`${inputCls} pl-9`}
                      type="url"
                    />
                  </div>
                  <textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={3}
                    placeholder="Descricao do link (opcional)"
                    className={`${inputCls} resize-none`}
                  />
                </>
              )}

              {/* Tags */}
              <div>
                <label className="text-xs text-dim font-medium uppercase tracking-wider mb-2 block">
                  Tags
                </label>
                <TagsInput tags={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
              </div>

              {/* Cover color */}
              <div>
                <label className="text-xs text-dim font-medium uppercase tracking-wider mb-2 block">
                  Cor de destaque
                </label>
                <div className="flex gap-2">
                  {COVER_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, coverColor: color })}
                      className={`w-7 h-7 rounded-full transition-all ${
                        form.coverColor === color
                          ? "ring-2 ring-offset-2 ring-accent ring-offset-[#0A0A0A] scale-110"
                          : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-bg-card rounded-b-2xl border-t border-[var(--border-color)] px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm text-dim hover:text-cream hover:bg-bg-elevated transition-colors"
              >
                Cancelar
              </button>
              <Button type="submit" size="sm" disabled={submitting || !form.title.trim()}>
                {editing ? (
                  <>
                    <Save className="w-4 h-4" />
                    {submitting ? "Salvando..." : "Salvar"}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {submitting ? "Criando..." : "Criar"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
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

/* ------------------------------------------------------------------ */
/*  Resource Card                                                      */
/* ------------------------------------------------------------------ */

function ResourceCard({
  resource,
  isAdmin,
  onClick,
  onDelete,
}: {
  resource: WikiResource;
  isAdmin: boolean;
  onClick: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  const type = (resource.resourceType || "article") as ResourceType;
  const cat = resource.category || "guides";

  // Article card
  if (type === "article") {
    const preview = (resource.content || "").slice(0, 120);
    return (
      <div
        onClick={onClick}
        className="group relative rounded-2xl border border-[var(--border-color)] bg-bg-card hover:border-accent/20 transition-all cursor-pointer overflow-hidden"
      >
        {/* Colored top strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: resource.coverColor || COVER_COLORS[0] }} />

        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-cream leading-snug line-clamp-2">
              {resource.title}
            </h3>
            {isAdmin && (
              <button
                onClick={(e) => onDelete(resource.id, e)}
                className="p-1.5 rounded-lg text-dim/0 group-hover:text-dim hover:!text-red-400 hover:bg-bg-elevated transition-all flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Badge variant={categoryBadgeVariant[cat] || "default"}>
            {categoryLabel[cat] || cat}
          </Badge>

          {preview && (
            <p className="text-sm text-dim leading-relaxed line-clamp-2">
              {preview}
              {(resource.content || "").length > 120 ? "..." : ""}
            </p>
          )}

          {/* Tags */}
          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 pt-1 text-xs text-dim">
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              {resource.authorName || "Anonimo"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(resource.updatedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Template card
  if (type === "template") {
    const fStyle = getFileTypeStyle(resource.fileType);
    return (
      <div
        onClick={onClick}
        className="group relative rounded-2xl border border-[var(--border-color)] bg-bg-card hover:border-accent/20 transition-all cursor-pointer overflow-hidden"
      >
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${fStyle.bg} flex-shrink-0`}>
              <FileSpreadsheet className={`w-7 h-7 ${fStyle.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-cream leading-snug line-clamp-2">
                  {resource.title}
                </h3>
                {isAdmin && (
                  <button
                    onClick={(e) => onDelete(resource.id, e)}
                    className="p-1.5 rounded-lg text-dim/0 group-hover:text-dim hover:!text-red-400 hover:bg-bg-elevated transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {resource.fileType && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase mt-1 ${fStyle.bg} ${fStyle.text}`}
                >
                  {resource.fileType}
                </span>
              )}
            </div>
          </div>

          {resource.content && (
            <p className="text-sm text-dim line-clamp-2">{resource.content}</p>
          )}

          {resource.fileUrl && (
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar template
            </a>
          )}

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-xs text-dim">
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              {resource.authorName || "Anonimo"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(resource.updatedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // File card
  if (type === "file") {
    const fStyle = getFileTypeStyle(resource.fileType);
    return (
      <div
        onClick={onClick}
        className="group relative rounded-2xl border border-[var(--border-color)] bg-bg-card hover:border-accent/20 transition-all cursor-pointer overflow-hidden"
      >
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${fStyle.bg} flex-shrink-0`}>
              <File className={`w-7 h-7 ${fStyle.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-cream leading-snug line-clamp-2">
                  {resource.title}
                </h3>
                {isAdmin && (
                  <button
                    onClick={(e) => onDelete(resource.id, e)}
                    className="p-1.5 rounded-lg text-dim/0 group-hover:text-dim hover:!text-red-400 hover:bg-bg-elevated transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                {resource.fileType && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${fStyle.bg} ${fStyle.text}`}
                  >
                    {resource.fileType}
                  </span>
                )}
                {resource.fileName && (
                  <span className="text-xs text-dim truncate">{resource.fileName}</span>
                )}
              </div>
            </div>
          </div>

          {resource.content && (
            <p className="text-sm text-dim line-clamp-2">{resource.content}</p>
          )}

          {resource.fileUrl && (
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar arquivo
            </a>
          )}

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-xs text-dim">
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              {resource.authorName || "Anonimo"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(resource.updatedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Link card
  if (type === "link") {
    const urlPreview = resource.externalUrl
      ? resource.externalUrl.replace(/^https?:\/\//, "").split("/")[0]
      : "";

    return (
      <div
        onClick={onClick}
        className="group relative rounded-2xl border border-[var(--border-color)] bg-bg-card hover:border-accent/20 transition-all cursor-pointer overflow-hidden"
      >
        <div className="p-5 space-y-3">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 flex-shrink-0">
              <ExternalLink className="w-7 h-7 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-cream leading-snug line-clamp-2">
                  {resource.title}
                </h3>
                {isAdmin && (
                  <button
                    onClick={(e) => onDelete(resource.id, e)}
                    className="p-1.5 rounded-lg text-dim/0 group-hover:text-dim hover:!text-red-400 hover:bg-bg-elevated transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {urlPreview && (
                <p className="text-xs text-dim mt-0.5 truncate">{urlPreview}</p>
              )}
            </div>
          </div>

          {resource.content && (
            <p className="text-sm text-dim line-clamp-2">{resource.content}</p>
          )}

          {resource.externalUrl && (
            <a
              href={resource.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir link
            </a>
          )}

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-xs text-dim">
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3" />
              {resource.authorName || "Anonimo"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(resource.updatedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Detail View                                                        */
/* ------------------------------------------------------------------ */

function ResourceDetail({
  resource,
  isAdmin,
  onBack,
  onEdit,
  onDelete,
}: {
  resource: WikiResource;
  isAdmin: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const type = (resource.resourceType || "article") as ResourceType;
  const cat = resource.category || "guides";

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-dim hover:text-cream transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          Biblioteca
        </button>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4" />
              Editar
            </Button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
              title="Excluir recurso"
            >
              <Trash2 className="w-4 h-4 text-dim hover:text-danger" />
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div>
        {/* Colored strip */}
        {type === "article" && (
          <div
            className="h-1.5 w-20 rounded-full mb-4"
            style={{ backgroundColor: resource.coverColor || COVER_COLORS[0] }}
          />
        )}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={categoryBadgeVariant[cat] || "default"}>
            {categoryLabel[cat] || cat}
          </Badge>
          {type !== "article" && (
            <Badge variant="default">
              {RESOURCE_TYPES.find((r) => r.value === type)?.label || type}
            </Badge>
          )}
        </div>
        <h2 className="text-2xl font-serif text-cream">{resource.title}</h2>
        <div className="flex items-center gap-3 mt-2 text-xs text-dim">
          <span className="inline-flex items-center gap-1">
            <User className="w-3 h-3" />
            {resource.authorName || "Anonimo"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(resource.updatedAt).toLocaleDateString("pt-BR")}
          </span>
        </div>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {resource.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons for file/link */}
      {(type === "template" || type === "file") && resource.fileUrl && (
        <a
          href={resource.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-accent text-[#0A0A0A] hover:brightness-110 transition-all"
        >
          <Download className="w-4 h-4" />
          {type === "template" ? "Baixar template" : "Baixar arquivo"}
          {resource.fileType && (
            <span className="uppercase text-xs opacity-70">({resource.fileType})</span>
          )}
        </a>
      )}

      {type === "link" && resource.externalUrl && (
        <a
          href={resource.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir link
        </a>
      )}

      {/* Content */}
      {resource.content && (
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-card p-6">
          <pre className="text-cream/90 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {resource.content}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function BibliotecaPage() {
  const [resources, setResources] = useState<WikiResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [selectedResource, setSelectedResource] = useState<WikiResource | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<WikiResource | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check permissions
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (user) {
          const perms = user.permissions || [];
          setIsAdmin(
            perms.includes("admin") ||
              perms.includes("manage_eval") ||
              perms.includes("manage_users")
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchResources = useCallback(async () => {
    try {
      const res = await fetch("/api/wiki");
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      }
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchesCategory =
        activeCategory === "all" || r.category === activeCategory;
      const matchesSearch =
        search === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.content || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [resources, search, activeCategory]);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!confirm("Tem certeza que deseja excluir este recurso?")) return;

    const res = await fetch(`/api/wiki/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (selectedResource?.id === id) setSelectedResource(null);
      fetchResources();
    }
  };

  const handleOpenEdit = (resource: WikiResource) => {
    setEditingResource(resource);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingResource(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-dim text-sm">Carregando biblioteca...</div>
      </div>
    );
  }

  // Detail View
  if (selectedResource) {
    return (
      <>
        <ResourceDetail
          resource={selectedResource}
          isAdmin={isAdmin}
          onBack={() => setSelectedResource(null)}
          onEdit={() => handleOpenEdit(selectedResource)}
          onDelete={() => handleDelete(selectedResource.id)}
        />
        <ResourceModal
          open={showModal}
          onClose={handleCloseModal}
          onSaved={() => {
            fetchResources();
            // Refresh the detail view
            fetch(`/api/wiki/${selectedResource.id}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => {
                if (data) setSelectedResource({ ...data, tags: data.tags || [] });
              });
          }}
          editing={editingResource}
        />
      </>
    );
  }

  // Category counts
  const counts: Record<string, number> = { all: resources.length };
  for (const r of resources) {
    const cat = r.category || "guides";
    counts[cat] = (counts[cat] || 0) + 1;
  }

  // List View
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-cream">Biblioteca</h2>
          <p className="text-dim text-sm mt-1">
            Guias, templates e recursos da liga
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => {
              setEditingResource(null);
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4" />
            Novo Recurso
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim pointer-events-none" />
        <input
          placeholder="Buscar recursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-9`}
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-1 bg-bg-surface/80 border border-[var(--border-color)] rounded-xl w-fit flex-wrap">
        {CATEGORY_FILTERS.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-1.5 text-sm rounded-lg transition-all duration-150 inline-flex items-center gap-1.5 ${
                activeCategory === cat.value
                  ? "bg-accent text-[#0A0A0A] font-medium"
                  : "text-dim hover:text-cream"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {cat.label}
              {counts[cat.value] !== undefined && (
                <span
                  className={`text-[10px] ml-0.5 ${
                    activeCategory === cat.value ? "opacity-70" : "text-dim/60"
                  }`}
                >
                  {counts[cat.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Resource Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-bg-card p-8 text-center">
          <BookOpen className="w-8 h-8 text-dim mx-auto mb-3" />
          <p className="text-dim text-sm">Nenhum recurso encontrado.</p>
          {isAdmin && (
            <button
              onClick={() => {
                setEditingResource(null);
                setShowModal(true);
              }}
              className="mt-3 text-sm text-accent hover:underline"
            >
              Criar o primeiro recurso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              isAdmin={isAdmin}
              onClick={() => setSelectedResource(resource)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <ResourceModal
        open={showModal}
        onClose={handleCloseModal}
        onSaved={fetchResources}
        editing={editingResource}
      />
    </div>
  );
}
