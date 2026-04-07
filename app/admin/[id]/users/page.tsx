"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, CheckCircle, X } from "lucide-react";

interface User { id: string; email: string; name: string; type: string; permissions: string; memberStatus: string | null; createdAt: string; }

const PERMISSIONS = [
  { key: "admin", label: "Administrador", desc: "Acesso total" },
  { key: "evaluate", label: "Avaliar", desc: "Pode avaliar equipes (banca)" },
  { key: "view_ranking", label: "Ver ranking", desc: "Acesso ao ranking" },
  { key: "manage_users", label: "Gerenciar usuarios", desc: "Adicionar/editar membros" },
  { key: "manage_eval", label: "Gerenciar avaliacao", desc: "Editar configuracoes" },
  { key: "view_reports", label: "Ver relatorios", desc: "Acesso a analytics" },
];

const MEMBER_STATUSES = [
  { key: "presidente", label: "Presidente" },
  { key: "vice-presidente", label: "Vice-Presidente" },
  { key: "trainee", label: "Trainee" },
  { key: "alumni", label: "Alumni" },
];

function statusLabel(status: string | null): string {
  const found = MEMBER_STATUSES.find((s) => s.key === status);
  return found?.label || status || "Trainee";
}

function statusColor(status: string | null): string {
  switch (status) {
    case "presidente": return "bg-amber-500/15 text-amber-400 border-amber-500/20";
    case "vice-presidente": return "bg-amber-500/10 text-amber-300 border-amber-500/15";
    case "diretor": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "coordenador": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "membro": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "trainee": return "bg-white/5 text-dim border-white/10";
    case "alumni": return "bg-white/5 text-dim/60 border-white/5";
    default: return "bg-white/5 text-dim border-white/10";
  }
}

export default function UsersPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", type: "member", permissions: ["evaluate"] as string[] });
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, [id]);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/users`);
      const d = await res.json();
      setUsers(d.users || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function togglePerm(perm: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  }

  async function handleAdd() {
    setIsAdding(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: "", email: "", password: "", type: "member", permissions: ["evaluate"] });
        showMsg("Membro adicionado");
        loadUsers();
      }
    } catch {
      // silent
    } finally {
      setIsAdding(false);
    }
  }

  function getPerms(raw: string): string[] {
    try { return JSON.parse(raw || "[]"); } catch { return []; }
  }

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState<string>("trainee");
  const [savingPerms, setSavingPerms] = useState(false);

  function startEdit(u: User) {
    setEditingUser(u.id);
    setEditPerms(getPerms(u.permissions));
    setEditStatus(u.memberStatus || "trainee");
  }

  function toggleEditPerm(perm: string) {
    setEditPerms((p) => p.includes(perm) ? p.filter((x) => x !== perm) : [...p, perm]);
  }

  async function savePerms(userId: string) {
    setSavingPerms(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: editPerms, memberStatus: editStatus }),
      });
      if (res.ok) {
        setEditingUser(null);
        showMsg("Atualizado com sucesso");
        loadUsers();
      }
    } catch {
      // silent
    } finally {
      setSavingPerms(false);
    }
  }

  function showMsg(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  const members = users.filter((u) => u.type === "member");
  const candidateUsers = users.filter((u) => u.type === "candidate");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Usuarios & Permissoes</h2>
          <p className="text-dim text-sm mt-1">{members.length} membros · {candidateUsers.length} candidatos</p>
        </div>
        <div className="flex items-center gap-3">
          {success && (
            <div className="flex items-center gap-2 text-sm text-sage bg-sage/10 border border-sage/20 px-3 py-1.5 rounded-lg">
              <CheckCircle size={14} />
              {success}
            </div>
          )}
          <Button onClick={() => setShowAdd(!showAdd)} variant={showAdd ? "secondary" : "primary"} size="sm">
            {showAdd ? <><X size={14} /> Cancelar</> : <><UserPlus size={14} /> Adicionar Membro</>}
          </Button>
        </div>
      </div>

      {/* Add member form */}
      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Novo Membro</CardTitle>
            <CardDescription>Membros fazem login e tem permissoes configuraveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>

            <div>
              <span className="text-sm font-medium text-cream/80 block mb-2">Permissoes</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PERMISSIONS.map((p) => (
                  <label key={p.key} className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${form.permissions.includes(p.key) ? "border-accent/30 bg-accent/5" : "border-[var(--border-color)] hover:border-accent/20"}`}>
                    <input type="checkbox" checked={form.permissions.includes(p.key)} onChange={() => togglePerm(p.key)} className="mt-0.5 w-4 h-4 rounded border-white/20 bg-bg-elevated text-accent focus:ring-accent" />
                    <div>
                      <span className="text-xs font-medium text-cream block">{p.label}</span>
                      <span className="text-[9px] text-dim">{p.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleAdd} isLoading={isAdding} disabled={!form.name || !form.email || !form.password}>
              <UserPlus size={14} />
              Criar Membro
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Membros <Badge variant="accent">{members.length}</Badge></CardTitle>
          <CardDescription>Equipe organizadora com permissoes individuais</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-dim text-sm py-4 text-center">Nenhum membro. Clique em &quot;Adicionar Membro&quot;.</p>
          ) : (
            <div className="space-y-2">
              {members.map((u) => {
                const perms = getPerms(u.permissions);
                const isEditing = editingUser === u.id;
                return (
                  <div key={u.id} className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                    <div className="flex items-center justify-between p-3 hover:bg-bg-surface">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-cream">{u.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColor(u.memberStatus)}`}>
                          {statusLabel(u.memberStatus)}
                        </span>
                        <span className="text-[10px] text-dim">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          {perms.map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[9px] font-medium">{p}</span>
                          ))}
                        </div>
                        <button onClick={() => isEditing ? setEditingUser(null) : startEdit(u)} className="text-[10px] text-dim hover:text-cream transition-colors ml-2">
                          {isEditing ? "Cancelar" : "Editar"}
                        </button>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="p-4 bg-bg-surface border-t border-[var(--border-color)] space-y-4">
                        {/* Cargo / Status */}
                        <div>
                          <span className="text-xs font-medium text-cream/80 block mb-2">Cargo</span>
                          <div className="flex flex-wrap gap-2">
                            {MEMBER_STATUSES.map((s) => (
                              <button
                                key={s.key}
                                onClick={() => setEditStatus(s.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                  editStatus === s.key
                                    ? "border-accent/40 bg-accent/10 text-accent"
                                    : "border-[var(--border-color)] text-dim hover:border-accent/20 hover:text-cream"
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Permissoes */}
                        <div>
                          <span className="text-xs font-medium text-cream/80 block mb-2">Permissoes</span>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {PERMISSIONS.map((p) => (
                              <label key={p.key} className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${editPerms.includes(p.key) ? "border-accent/30 bg-accent/5" : "border-[var(--border-color)] hover:border-accent/20"}`}>
                                <input type="checkbox" checked={editPerms.includes(p.key)} onChange={() => toggleEditPerm(p.key)} className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-bg-elevated text-accent focus:ring-accent" />
                                <div>
                                  <span className="text-[11px] font-medium text-cream block">{p.label}</span>
                                  <span className="text-[9px] text-dim">{p.desc}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <Button size="sm" onClick={() => savePerms(u.id)} isLoading={savingPerms}>
                          <CheckCircle size={12} />
                          Salvar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Candidatos <Badge variant="default">{candidateUsers.length}</Badge></CardTitle>
          <CardDescription>Contas criadas automaticamente ao importar candidatos</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-dim text-sm">{candidateUsers.length} conta(s) de candidato. Geradas na importacao.</p>
        </CardContent>
      </Card>
    </div>
  );
}
