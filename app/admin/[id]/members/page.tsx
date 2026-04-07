"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChevronRight, X, Loader2, Linkedin, Mail, GraduationCap, Calendar, Shield, UserCircle, ExternalLink, Instagram, Phone, Building2 } from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  course: string | null;
  semester: string | null;
  memberStatus: string | null;
  nucleusId: string | null;
  joinedAt: string | null;
  linkedinUrl: string | null;
  bio: string | null;
  anoIngresso: string | null;
  sala: string | null;
  instagram: string | null;
  telefone: string | null;
  empresa: string | null;
  cargoEmpresa: string | null;
  empresaSite: string | null;
  empresaLinkedin: string | null;
  empresaDescricao: string | null;
  avatarUrl: string | null;
}

const statusToRole: Record<string, string> = {
  trainee: "Trainee",
  membro: "Membro",
  "vice-presidente": "Vice-Presidente",
  presidente: "Presidente",
  alumni: "Alumni",
};

const promoteMap: Record<string, string> = {
  trainee: "membro",
  membro: "vice-presidente",
  "vice-presidente": "presidente",
};

function displayRole(m: Member): string {
  return statusToRole[m.memberStatus || "trainee"] || "Trainee";
}

const filters = ["Todos", "Trainee", "Membro", "Vice-Presidente", "Presidente", "Alumni"];
const roleVariant: Record<string, "accent" | "success" | "info" | "default" | "warning"> = {
  Presidente: "accent", "Vice-Presidente": "warning", Membro: "success", Trainee: "info", Alumni: "default",
};

const cargoOptions = ["trainee", "membro", "vice-presidente", "presidente"];

export default function MembersPage() {
  const { id } = useParams<{ id: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [selected, setSelected] = useState<Member | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Member>>({});
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetPwMsg, setResetPwMsg] = useState<string | null>(null);

  // Form state for new member
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCourse, setFormCourse] = useState("ADM");
  const [formSemester, setFormSemester] = useState("1");
  const [formAnoIngresso, setFormAnoIngresso] = useState("2025");
  const [formSala, setFormSala] = useState("");
  const [formCargo, setFormCargo] = useState("trainee");
  const [formPassword, setFormPassword] = useState("harven2026");
  const [formError, setFormError] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filtered = members.filter((m) => {
    const role = displayRole(m);
    if (filter !== "Todos" && role !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.course || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      setFormError("Preencha todos os campos obrigatorios.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword,
          course: formCourse,
          semester: formSemester,
          ano_ingresso: formAnoIngresso,
          sala: formSala || null,
          member_status: formCargo,
          joined_at: new Date().toISOString().slice(0, 10),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setFormError(err.error || "Erro ao criar membro.");
        return;
      }
      // Reset form and refetch
      setFormName("");
      setFormEmail("");
      setFormCourse("ADM");
      setFormSemester("2025.2");
      setFormCargo("trainee");
      setFormPassword("membro2026");
      setShowForm(false);
      await fetchMembers();
    } catch {
      setFormError("Erro de conexao.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePromote(m: Member) {
    const nextStatus = promoteMap[m.memberStatus || "trainee"];
    if (!nextStatus) return;
    setSaving(true);
    try {
      await fetch(`/api/members/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberStatus: nextStatus }),
      });
      await fetchMembers();
      // Update selected panel
      setSelected((prev) => (prev?.id === m.id ? { ...prev, memberStatus: nextStatus } : prev));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(m: Member) {
    setSaving(true);
    try {
      await fetch(`/api/members/${m.id}`, { method: "DELETE" });
      await fetchMembers();
      setSelected((prev) => (prev?.id === m.id ? { ...prev, memberStatus: "alumni" } : prev));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(m: Member) {
    setEditing(true);
    setEditData({
      course: m.course || "",
      semester: m.semester || "",
      anoIngresso: m.anoIngresso || "",
      sala: m.sala || "",
      linkedinUrl: m.linkedinUrl || "",
      instagram: m.instagram || "",
      telefone: m.telefone || "",
      empresa: m.empresa || "",
      cargoEmpresa: m.cargoEmpresa || "",
      bio: m.bio || "",
    });
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    try {
      await fetch(`/api/members/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      setEditing(false);
      await fetchMembers();
      // Update selected with new data
      setSelected((prev) => (prev ? { ...prev, ...editData } : prev));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-cream">Membros</h1>
          <div className="flex items-center gap-3 mt-2">
            {[
              { label: "Diretoria", count: members.filter(m => ["presidente","vice-presidente"].includes(m.memberStatus || "")).length, color: "bg-accent" },
              { label: "Membros", count: members.filter(m => m.memberStatus === "membro").length, color: "bg-sage" },
              { label: "Trainees", count: members.filter(m => !m.memberStatus || m.memberStatus === "trainee").length, color: "bg-atom" },
              { label: "Alumni", count: members.filter(m => m.memberStatus === "alumni").length, color: "bg-molecule" },
            ].filter(s => s.count > 0).map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                <span className="text-xs text-dim">{s.count} {s.label}</span>
              </div>
            ))}
            <span className="text-xs text-dim/40">·</span>
            <span className="text-xs text-dim/60">{members.length} total</span>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Adicionar
        </Button>
      </div>

      {/* Add Member Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[6px]" onClick={() => setShowForm(false)} style={{ animation: "modal-fade 0.2s ease-out" }} />
          <div className="relative z-10 w-full max-w-md" style={{ animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)]">
              {/* Header */}
              <div className="border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <h2 className="text-lg font-semibold text-cream">{formName || "Novo Membro"}</h2>
                </div>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors"><X size={18} /></button>
              </div>

              <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                {/* Name — big input */}
                <input autoFocus value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nome completo" className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40" />

                {/* Cargo pills */}
                <div className="flex gap-2 flex-wrap">
                  {cargoOptions.map(c => (
                    <button key={c} type="button" onClick={() => setFormCargo(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${formCargo === c ? "bg-accent text-white" : "bg-bg-elevated text-dim hover:text-cream"}`}>
                      {statusToRole[c]}
                    </button>
                  ))}
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-accent flex-shrink-0" />
                  <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="email@harven.edu.br" className="flex-1 px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                </div>

                {/* Course + Semester */}
                <div className="flex items-center gap-3">
                  <GraduationCap size={16} className="text-accent flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <select value={formCourse} onChange={(e) => setFormCourse(e.target.value)} className="px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all">
                      <option value="ADM">ADM</option>
                      <option value="ENG. PROD.">ENG. PROD.</option>
                      <option value="DIR">DIR</option>
                    </select>
                    <select value={formSemester} onChange={(e) => setFormSemester(e.target.value)} className="px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all">
                      {["1","2","3","4","5","6","7","8"].map(s => <option key={s} value={s}>{s}o semestre</option>)}
                    </select>
                  </div>
                </div>

                {/* Year + Room */}
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-accent flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <select value={formAnoIngresso} onChange={(e) => setFormAnoIngresso(e.target.value)} className="px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all">
                      {["2023","2024","2025","2026"].map(a => <option key={a} value={a}>Ingresso {a}</option>)}
                    </select>
                    <input value={formSala} onChange={(e) => setFormSala(e.target.value)} placeholder="Sala (A1, B2...)" className="px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                  </div>
                </div>

                {/* Password */}
                <div className="flex items-center gap-3">
                  <Shield size={16} className="text-accent flex-shrink-0" />
                  <div className="flex-1">
                    <input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Senha do primeiro acesso" className="w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
                    <p className="text-[10px] text-dim mt-1 ml-1">O membro podera alterar depois no perfil</p>
                  </div>
                </div>

                {formError && <p className="text-xs text-red-400 ml-7">{formError}</p>}
              </form>

              {/* Footer */}
              <div className="border-t border-[var(--border-color)] px-6 py-4 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-dim hover:text-cream transition-colors">Cancelar</button>
                <button onClick={(e) => { e.preventDefault(); handleCreate(e as unknown as React.FormEvent); }} disabled={!formName || !formEmail || !formPassword || saving} className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Criar Membro
                </button>
              </div>
            </div>
          </div>
          <style jsx>{`
            @keyframes modal-fade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes modal-scale { from { opacity: 0; transform: scale(0.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
          `}</style>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-accent/15 text-accent" : "text-dim hover:text-cream"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Member Cards — Grouped by Role */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-dim" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card">
          <p className="text-dim">Nenhum membro encontrado</p>
        </div>
      ) : (() => {
        const getInitials = (name: string) => name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
        const avatarColors = ["bg-accent/20 text-accent", "bg-sage/20 text-sage", "bg-atom/20 text-atom", "bg-molecule/20 text-molecule"];
        const getColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];

        const roleAccent: Record<string, string> = {
          Presidente: "from-accent/10 to-accent/5 ring-accent/20",
          "Vice-Presidente": "from-warning/10 to-warning/5 ring-warning/20",
        };

        // Group by role hierarchy
        const groups: { key: string; label: string; members: Member[]; accentColor: string }[] = [
          { key: "diretoria", label: "Diretoria", accentColor: "bg-accent", members: filtered.filter(m => ["presidente", "vice-presidente"].includes(m.memberStatus || "")) },
          { key: "membro", label: "Membros", accentColor: "bg-sage", members: filtered.filter(m => m.memberStatus === "membro") },
          { key: "trainee", label: "Trainees", accentColor: "bg-atom", members: filtered.filter(m => !m.memberStatus || m.memberStatus === "trainee") },
          { key: "alumni", label: "Alumni", accentColor: "bg-molecule", members: filtered.filter(m => m.memberStatus === "alumni") },
        ].filter(g => g.members.length > 0);

        const isFiltered = filter !== "Todos";

        const renderFeaturedCard = (m: Member) => {
          const role = displayRole(m);
          const initials = getInitials(m.name);
          const gradient = roleAccent[role] || "from-accent/10 to-accent/5 ring-accent/20";
          const isPresidente = role === "Presidente";

          return (
            <div
              key={m.id}
              onClick={() => { setSelected(m); setEditing(false); }}
              className={`rounded-2xl bg-gradient-to-br ${gradient} ring-1 p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] group relative overflow-hidden`}
            >
              {/* Decorative circle */}
              <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-accent/[0.06] blur-sm" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full bg-accent/[0.04] blur-sm" />

              <div className="relative">
                {/* Top: Avatar centered */}
                <div className="flex flex-col items-center text-center mb-4">
                  {m.avatarUrl ? (
                    <img src={m.avatarUrl} alt={m.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-accent/20 mb-3" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-accent/20 text-accent flex items-center justify-center font-bold text-2xl ring-2 ring-accent/10 mb-3">
                      {initials}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-cream group-hover:text-accent transition-colors">{m.name}</h3>
                  <Badge variant={roleVariant[role] || "default"} className="mt-1.5">{role}</Badge>
                </div>

                {/* Bottom: Info */}
                <div className="space-y-2 pt-3 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-dim">
                    <Mail size={12} className="shrink-0" />
                    <span className="text-xs truncate">{m.email}</span>
                  </div>
                  {m.course && (
                    <div className="flex items-center gap-2 text-dim">
                      <GraduationCap size={12} className="shrink-0" />
                      <span className="text-xs">{m.course}{m.semester ? ` · ${m.semester}o semestre` : ""}</span>
                    </div>
                  )}
                  {(m.linkedinUrl || m.instagram) && (
                    <div className="flex items-center gap-3 pt-1">
                      {m.linkedinUrl && (
                        <a href={m.linkedinUrl.startsWith("http") ? m.linkedinUrl : `https://${m.linkedinUrl}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[#0A66C2] hover:underline text-[11px]"><Linkedin size={12} /> LinkedIn</a>
                      )}
                      {m.instagram && (
                        <a href={`https://instagram.com/${m.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-molecule hover:underline text-[11px]"><Instagram size={12} /> {m.instagram}</a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        };

        const renderMemberCard = (m: Member) => {
          const role = displayRole(m);
          const initials = getInitials(m.name);
          const colorMap: Record<string, string> = {
            Membro: "from-sage/10 to-sage/5 ring-sage/20",
            Trainee: "from-atom/10 to-atom/5 ring-atom/15",
            Alumni: "from-molecule/10 to-molecule/5 ring-molecule/15",
          };
          const gradient = colorMap[role] || "from-bg-elevated to-bg-card ring-[var(--border-color)]";

          return (
            <div
              key={m.id}
              onClick={() => { setSelected(m); setEditing(false); }}
              className={`rounded-2xl bg-gradient-to-br ${gradient} ring-1 p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] group relative overflow-hidden`}
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[var(--border-color)] opacity-[0.15] blur-sm" />

              <div className="relative flex flex-col items-center text-center">
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt={m.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[var(--border-color)] mb-3" />
                ) : (
                  <div className={`w-16 h-16 rounded-2xl ${getColor(m.name)} flex items-center justify-center font-bold text-lg ring-2 ring-[var(--border-color)] mb-3`}>
                    {initials}
                  </div>
                )}
                <h3 className="text-[13px] font-semibold text-cream group-hover:text-accent transition-colors leading-tight">{m.name}</h3>
                <Badge variant={roleVariant[role] || "default"} className="mt-1.5">{role}</Badge>

                <div className="w-full space-y-1.5 pt-3 mt-3 border-t border-[var(--border-color)]">
                  <div className="flex items-center gap-2 text-dim justify-center">
                    <Mail size={11} className="shrink-0" />
                    <span className="text-[11px] truncate">{m.email}</span>
                  </div>
                  {(m.course || m.semester) && (
                    <div className="flex items-center gap-2 text-dim justify-center">
                      <GraduationCap size={11} className="shrink-0" />
                      <span className="text-[11px]">{m.course || ""}{m.course && m.semester ? " · " : ""}{m.semester ? `${m.semester}o sem` : ""}{m.sala ? ` · Sala ${m.sala}` : ""}</span>
                    </div>
                  )}
                  {(m.linkedinUrl || m.instagram) && (
                    <div className="flex items-center gap-3 pt-1 justify-center">
                      {m.linkedinUrl && (
                        <a href={m.linkedinUrl.startsWith("http") ? m.linkedinUrl : `https://${m.linkedinUrl}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-[#0A66C2] hover:underline text-[11px]"><Linkedin size={12} /> LinkedIn</a>
                      )}
                      {m.instagram && (
                        <a href={`https://instagram.com/${m.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 text-molecule hover:underline text-[11px]"><Instagram size={12} /> {m.instagram}</a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        };

        if (isFiltered) {
          const isDiretoria = filter === "Presidente" || filter === "Vice-Presidente";
          return (
            <div className={isDiretoria ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"}>
              {filtered.map(m => isDiretoria ? renderFeaturedCard(m) : renderMemberCard(m))}
            </div>
          );
        }

        return (
          <div className="space-y-8">
            {groups.map(group => (
              <div key={group.key}>
                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`w-2 h-2 rounded-full ${group.accentColor}`} />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-dim">{group.label}</h2>
                  <span className="text-[10px] text-dim/40 font-medium">{group.members.length}</span>
                  <div className="flex-1 border-t border-[var(--border-color)] ml-1" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.members.map(m => group.key === "diretoria" ? renderFeaturedCard(m) : renderMemberCard(m))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Profile Panel (slide-in from right) */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/25 backdrop-blur-[6px]" onClick={() => { setSelected(null); setEditing(false); }} />
          <div className="relative w-full max-w-lg bg-bg-surface border-l overflow-y-auto animate-fade-in">
            {/* Header with avatar */}
            <div className="p-6 pb-0">
              <div className="flex items-center justify-between mb-6">
                <Badge variant={roleVariant[displayRole(selected)] || "default"}>{displayRole(selected)}</Badge>
                <button onClick={() => { setSelected(null); setEditing(false); }} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-bg-elevated text-dim"><X size={18} /></button>
              </div>

              <div className="flex items-center gap-5 mb-6">
                {selected.avatarUrl ? (
                  <img src={selected.avatarUrl} alt={selected.name} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center text-accent font-bold text-2xl shrink-0">
                    {selected.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-cream">{selected.name}</h2>
                  <div className="flex items-center gap-1.5 mt-1 text-dim">
                    <Mail size={12} />
                    <span className="text-xs">{selected.email}</span>
                  </div>
                  {selected.linkedinUrl && (
                    <a href={selected.linkedinUrl.startsWith("http") ? selected.linkedinUrl : `https://${selected.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-1 text-accent hover:text-accent-hover transition-colors">
                      <Linkedin size={12} />
                      <span className="text-xs">LinkedIn</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {editing ? (
              <div className="p-6 pt-0 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Editar Perfil</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Curso</label>
                    <select value={editData.course || ""} onChange={(e) => setEditData({ ...editData, course: e.target.value })} className="w-full h-9 rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent">
                      <option value="ADM">ADM</option>
                      <option value="ENG. PROD.">ENG. PROD.</option>
                      <option value="DIR">DIR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Semestre</label>
                    <select value={editData.semester || ""} onChange={(e) => setEditData({ ...editData, semester: e.target.value })} className="w-full h-9 rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent">
                      {["1","2","3","4","5","6","7","8"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Ano Ingresso</label>
                    <select value={editData.anoIngresso || ""} onChange={(e) => setEditData({ ...editData, anoIngresso: e.target.value })} className="w-full h-9 rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent">
                      {["2023","2024","2025","2026"].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Sala</label>
                    <Input value={editData.sala || ""} onChange={(e) => setEditData({ ...editData, sala: e.target.value })} placeholder="Ex: A1, B2" className="h-9 text-xs" />
                  </div>
                </div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim pt-2">Redes e Contato</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">LinkedIn</label>
                    <Input value={editData.linkedinUrl || ""} onChange={(e) => setEditData({ ...editData, linkedinUrl: e.target.value })} placeholder="linkedin.com/in/..." className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Instagram</label>
                    <Input value={editData.instagram || ""} onChange={(e) => setEditData({ ...editData, instagram: e.target.value })} placeholder="@usuario" className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Telefone</label>
                    <Input value={editData.telefone || ""} onChange={(e) => setEditData({ ...editData, telefone: e.target.value })} placeholder="(11) 99999-9999" className="h-9 text-xs" />
                  </div>
                </div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim pt-2">Experiencia Profissional</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Empresa</label>
                    <Input value={editData.empresa || ""} onChange={(e) => setEditData({ ...editData, empresa: e.target.value })} placeholder="Nome da empresa" className="h-9 text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Cargo</label>
                    <Input value={editData.cargoEmpresa || ""} onChange={(e) => setEditData({ ...editData, cargoEmpresa: e.target.value })} placeholder="Estagiario, Analista..." className="h-9 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Sobre</label>
                  <textarea
                    value={editData.bio || ""}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    rows={4}
                    placeholder="Interesses, experiencias, objetivos na liga..."
                    className="w-full rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 py-2 text-xs text-cream placeholder:text-dim/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={saveEdit} disabled={saving}>
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Salvar alteracoes
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="p-6 pt-0 space-y-6">
                {/* Bio */}
                {selected.bio && (
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Sobre</h3>
                    <p className="text-sm text-cream/80 leading-relaxed">{selected.bio}</p>
                  </div>
                )}

                {/* Info cards */}
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Informacoes</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)]">
                      <GraduationCap size={16} className="text-accent shrink-0" />
                      <div>
                        <p className="text-[9px] text-dim uppercase tracking-wider">Curso</p>
                        <p className="text-sm text-cream">{selected.course || "--"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)]">
                      <Shield size={16} className="text-sage shrink-0" />
                      <div>
                        <p className="text-[9px] text-dim uppercase tracking-wider">Cargo</p>
                        <p className="text-sm text-cream">{displayRole(selected)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)]">
                      <Calendar size={16} className="text-atom shrink-0" />
                      <div>
                        <p className="text-[9px] text-dim uppercase tracking-wider">Semestre</p>
                        <p className="text-sm text-cream">{selected.semester ? `${selected.semester}o semestre` : "--"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)]">
                      <Calendar size={16} className="text-molecule shrink-0" />
                      <div>
                        <p className="text-[9px] text-dim uppercase tracking-wider">Ano de Ingresso</p>
                        <p className="text-sm text-cream">{selected.anoIngresso || "--"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)]">
                      <UserCircle size={16} className="text-accent shrink-0" />
                      <div>
                        <p className="text-[9px] text-dim uppercase tracking-wider">Sala</p>
                        <p className="text-sm text-cream">{selected.sala || "--"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Redes e Contato */}
                {(selected.linkedinUrl || selected.instagram || selected.telefone) && (
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Redes e Contato</h3>
                    <div className="space-y-2">
                      {selected.linkedinUrl && (
                        <a href={selected.linkedinUrl.startsWith("http") ? selected.linkedinUrl : `https://${selected.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)] hover:ring-accent/20 transition-colors group">
                          <Linkedin size={16} className="text-[#0A66C2] shrink-0" />
                          <p className="text-sm text-cream group-hover:text-accent truncate flex-1">{selected.linkedinUrl}</p>
                          <ExternalLink size={12} className="text-dim/30 group-hover:text-accent" />
                        </a>
                      )}
                      {selected.instagram && (
                        <a href={`https://instagram.com/${selected.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)] hover:ring-molecule/20 transition-colors group">
                          <Instagram size={16} className="text-molecule shrink-0" />
                          <p className="text-sm text-cream group-hover:text-molecule truncate flex-1">{selected.instagram}</p>
                          <ExternalLink size={12} className="text-dim/30 group-hover:text-molecule" />
                        </a>
                      )}
                      {selected.telefone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)]">
                          <Phone size={16} className="text-sage shrink-0" />
                          <p className="text-sm text-cream">{selected.telefone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Experiencia Profissional */}
                {(selected.empresa || selected.cargoEmpresa) && (
                  <div>
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Experiencia Profissional</h3>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface ring-1 ring-[var(--border-color)]">
                      <Building2 size={16} className="text-accent shrink-0" />
                      <div>
                        <p className="text-sm text-cream">{selected.cargoEmpresa || "Membro"}</p>
                        <p className="text-[10px] text-dim">{selected.empresa}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Acoes</h3>
                  <div className="space-y-2">
                    <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => startEdit(selected)}>
                      <UserCircle size={14} /> Editar perfil
                    </Button>
                    {/* Reset password */}
                    <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => { setResetPwOpen(!resetPwOpen); setNewPassword(""); setResetPwMsg(null); }}>
                      <Shield size={14} /> Redefinir senha
                    </Button>
                    {resetPwOpen && (
                      <div className="p-3 rounded-xl bg-bg-elevated border border-[var(--border-color)] space-y-2">
                        <input
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nova senha (min. 6 caracteres)"
                          type="password"
                          className="w-full px-3 py-2 bg-bg-card border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                        />
                        {resetPwMsg && <p className={`text-xs ${resetPwMsg.includes("Erro") ? "text-red-400" : "text-sage"}`}>{resetPwMsg}</p>}
                        <button
                          disabled={newPassword.length < 6 || saving}
                          onClick={async () => {
                            setSaving(true);
                            try {
                              const res = await fetch(`/api/members/${selected.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ newPassword }),
                              });
                              if (res.ok) {
                                setResetPwMsg("Senha redefinida com sucesso");
                                setNewPassword("");
                                setTimeout(() => { setResetPwOpen(false); setResetPwMsg(null); }, 2000);
                              } else {
                                const err = await res.json();
                                setResetPwMsg(err.error || "Erro ao redefinir");
                              }
                            } catch { setResetPwMsg("Erro de conexao"); }
                            finally { setSaving(false); }
                          }}
                          className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          {saving ? "Redefinindo..." : "Confirmar"}
                        </button>
                      </div>
                    )}

                    {selected.memberStatus !== "alumni" && selected.memberStatus !== "presidente" && (
                      <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => handlePromote(selected)} disabled={saving}>
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
                        Promover para {statusToRole[promoteMap[selected.memberStatus || "trainee"]] || ""}
                      </Button>
                    )}
                    {selected.memberStatus !== "alumni" && (
                      <Button variant="danger" size="sm" className="w-full justify-start" onClick={() => handleDeactivate(selected)} disabled={saving}>
                        <X size={14} /> Mover para alumni
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
