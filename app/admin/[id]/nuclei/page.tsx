"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Layers, Users, FolderOpen, ChevronRight, Plus, Loader2 } from "lucide-react";

interface Nucleus {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  members: number;
  projects: number;
  coordinatorName: string | null;
}

export default function NucleiPage() {
  const { id } = useParams<{ id: string }>();
  const [nucleiList, setNucleiList] = useState<Nucleus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", color: "#C4A882" });

  useEffect(() => {
    fetchNuclei();
  }, []);

  async function fetchNuclei() {
    try {
      const res = await fetch("/api/nuclei");
      if (res.ok) {
        const data = await res.json();
        setNucleiList(data);
      }
    } catch (err) {
      console.error("Failed to fetch nuclei:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/nuclei", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          color: form.color,
        }),
      });
      if (res.ok) {
        setForm({ name: "", description: "", color: "#C4A882" });
        setShowForm(false);
        await fetchNuclei();
      }
    } catch (err) {
      console.error("Failed to create nucleus:", err);
    } finally {
      setCreating(false);
    }
  }

  const totalMembers = nucleiList.reduce((sum, n) => sum + n.members, 0);
  const totalProjects = nucleiList.reduce((sum, n) => sum + n.projects, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-serif text-cream">Nucleos de Pesquisa</h2>
          <p className="text-dim text-sm mt-1">
            {nucleiList.length} nucleos ativos -- {totalMembers} membros -- {totalProjects} projetos
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
        >
          <Plus size={14} />
          Novo Nucleo
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-cream">Criar Nucleo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">
                Nome
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Equity Research"
                className="w-full bg-bg-card border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">
                Descricao
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descricao do nucleo"
                className="w-full bg-bg-card border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-1">
                Cor
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs text-dim font-mono">{form.color}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-accent text-bg hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {creating ? "Criando..." : "Criar Nucleo"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg text-dim hover:text-cream transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Summary cards */}
      {nucleiList.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim">Nucleos</span>
            <p className="text-2xl font-bold font-mono text-cream mt-1">{nucleiList.length}</p>
          </div>
          <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim">Membros Alocados</span>
            <p className="text-2xl font-bold font-mono text-cream mt-1">{totalMembers}</p>
          </div>
          <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim">Projetos Ativos</span>
            <p className="text-2xl font-bold font-mono text-cream mt-1">{totalProjects}</p>
          </div>
        </div>
      )}

      {/* Nuclei grid */}
      {nucleiList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {nucleiList.map((nucleus) => (
            <Link
              key={nucleus.id}
              href={`/admin/${id}/nuclei/${nucleus.slug}`}
              className="group"
            >
              <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-5 hover:ring-accent/20 hover:bg-bg-surface transition-all duration-200 h-full flex flex-col">
                {/* Top: color indicator + name */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1 shrink-0"
                    style={{
                      backgroundColor: nucleus.color,
                      boxShadow: `0 0 0 3px ${nucleus.color}25, 0 0 8px ${nucleus.color}30`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-serif font-semibold text-cream group-hover:text-accent transition-colors">
                      {nucleus.name}
                    </h3>
                    <p className="text-[11px] text-dim mt-1 line-clamp-2">
                      {nucleus.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-dim/30 group-hover:text-accent/60 transition-colors shrink-0 mt-0.5"
                  />
                </div>

                {/* Coordinator */}
                {nucleus.coordinatorName && (
                  <div className="mb-4">
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-dim">Coordenador</span>
                    <p className="text-xs text-cream/80 mt-0.5">{nucleus.coordinatorName}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-3 border-t border-[var(--border-color)] mt-auto">
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-dim" />
                    <span className="text-xs text-cream/70 font-mono">{nucleus.members}</span>
                    <span className="text-[10px] text-dim">membros</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FolderOpen size={13} className="text-dim" />
                    <span className="text-xs text-cream/70 font-mono">{nucleus.projects}</span>
                    <span className="text-[10px] text-dim">{nucleus.projects === 1 ? "projeto" : "projetos"}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {nucleiList.length === 0 && (
        <div className="text-center py-16 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card">
          <div className="w-14 h-14 bg-accent/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers size={24} className="text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-cream mb-2">Nenhum nucleo cadastrado</h3>
          <p className="text-dim text-sm mb-6">Crie nucleos de pesquisa para organizar os membros</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
          >
            <Plus size={16} />
            Criar Primeiro Nucleo
          </button>
        </div>
      )}
    </div>
  );
}
