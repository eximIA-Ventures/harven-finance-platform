"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Linkedin, Instagram, Phone, Building2, GraduationCap, Mail, Camera, Upload } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  email: string;
  course: string | null;
  semester: string | null;
  memberStatus: string | null;
  joinedAt: string | null;
  linkedinUrl: string | null;
  instagram: string | null;
  telefone: string | null;
  empresa: string | null;
  cargoEmpresa: string | null;
  empresaSite: string | null;
  empresaLinkedin: string | null;
  empresaDescricao: string | null;
  avatarUrl: string | null;
  bio: string | null;
  anoIngresso: string | null;
  sala: string | null;
}

const statusToRole: Record<string, string> = {
  trainee: "Trainee", membro: "Membro", "vice-presidente": "Vice-Presidente", presidente: "Presidente", alumni: "Alumni",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(file: File) {
    if (!profile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", profile.id);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setForm((prev) => ({ ...prev, avatarUrl: data.url }));
        // Auto-save avatar
        await fetch(`/api/members/${profile.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: data.url }),
        });
        setProfile((prev) => prev ? { ...prev, avatarUrl: data.url } : prev);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((user) => {
        if (user.id) {
          return fetch(`/api/members/${user.id}`).then((r) => r.json());
        }
        return null;
      })
      .then((data) => {
        if (data && !data.error) {
          setProfile(data);
          setForm(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await fetch(`/api/members/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course: form.course,
        semester: form.semester,
        anoIngresso: form.anoIngresso,
        sala: form.sala,
        linkedinUrl: form.linkedinUrl,
        instagram: form.instagram,
        telefone: form.telefone,
        empresa: form.empresa,
        cargoEmpresa: form.cargoEmpresa,
        empresaSite: form.empresaSite,
        empresaLinkedin: form.empresaLinkedin,
        empresaDescricao: form.empresaDescricao,
        avatarUrl: form.avatarUrl,
        bio: form.bio,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-dim" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-20 text-dim">Perfil nao encontrado</div>;
  }

  const initials = profile.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-8 animate-fade-in-up max-w-2xl">
      <h1 className="text-2xl font-serif text-cream">Meu Perfil</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleAvatarUpload(file);
          e.target.value = "";
        }}
      />

      {/* Header card */}
      <Card>
        <CardContent className="flex items-center gap-6 py-6">
          <div
            className="relative group shrink-0 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            title="Alterar foto de perfil"
          >
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt={profile.name} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-accent/15 flex items-center justify-center text-accent font-bold text-2xl">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-cream">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Mail size={12} className="text-dim" />
              <span className="text-sm text-dim">{profile.email}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="success">{statusToRole[profile.memberStatus || "trainee"] || "Membro"}</Badge>
              {profile.course && <Badge variant="default">{profile.course}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Foto de perfil */}
      <Card>
        <CardContent className="py-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Foto de Perfil</h3>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              {form.avatarUrl ? (
                <img src={form.avatarUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-accent/15 flex items-center justify-center text-accent font-bold text-lg">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Enviando..." : "Enviar foto"}
              </Button>
              <p className="text-[9px] text-dim">JPEG, PNG ou WebP. Maximo 2MB.</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Ou cole uma URL</label>
            <Input value={form.avatarUrl || ""} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://exemplo.com/foto.jpg" className="h-9 text-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Academic info */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim flex items-center gap-2">
            <GraduationCap size={14} /> Informacoes Academicas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Curso</label>
              <select value={form.course || ""} onChange={(e) => setForm({ ...form, course: e.target.value })} className="w-full h-9 rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="">--</option>
                <option value="ADM">ADM</option>
                <option value="ENG. PROD.">ENG. PROD.</option>
                <option value="DIR">DIR</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Semestre</label>
              <select value={form.semester || ""} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full h-9 rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="">--</option>
                {["1","2","3","4","5","6","7","8"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Ano Ingresso</label>
              <select value={form.anoIngresso || ""} onChange={(e) => setForm({ ...form, anoIngresso: e.target.value })} className="w-full h-9 rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="">--</option>
                {["2022","2023","2024","2025","2026"].map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Sala</label>
              <Input value={form.sala || ""} onChange={(e) => setForm({ ...form, sala: e.target.value })} placeholder="Ex: A1, B2" className="h-9 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social & Contact */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim flex items-center gap-2">
            <Linkedin size={14} /> Redes e Contato
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">LinkedIn</label>
              <Input value={form.linkedinUrl || ""} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="linkedin.com/in/seu-perfil" className="h-9 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Instagram</label>
              <Input value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="@seu_usuario" className="h-9 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Telefone</label>
              <Input value={form.telefone || ""} onChange={(e) => {
                let v = e.target.value.replace(/\D/g, "").slice(0, 11);
                if (v.length > 6) v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
                else if (v.length > 2) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
                else if (v.length > 0) v = `(${v}`;
                setForm({ ...form, telefone: v });
              }} placeholder="(16) 99999-9999" className="h-9 text-xs" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work experience */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim flex items-center gap-2">
            <Building2 size={14} /> Experiencia Profissional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Empresa</label>
              <Input value={form.empresa || ""} onChange={(e) => setForm({ ...form, empresa: e.target.value })} placeholder="Nome da empresa" className="h-9 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Cargo</label>
              <select value={form.cargoEmpresa || ""} onChange={(e) => setForm({ ...form, cargoEmpresa: e.target.value })} className="w-full h-9 rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 text-xs text-cream focus:outline-none focus:ring-1 focus:ring-accent">
                <option value="">Selecionar...</option>
                <option value="Estagiario">Estagiario</option>
                <option value="Trainee">Trainee</option>
                <option value="Assistente">Assistente</option>
                <option value="Analista Jr">Analista Jr</option>
                <option value="Analista">Analista</option>
                <option value="Analista Sr">Analista Sr</option>
                <option value="Consultor">Consultor</option>
                <option value="Coordenador">Coordenador</option>
                <option value="Gerente">Gerente</option>
                <option value="Diretor">Diretor</option>
                <option value="Socio">Socio</option>
                <option value="CEO">CEO</option>
                <option value="Autonomo">Autonomo</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">Site da empresa</label>
              <Input value={form.empresaSite || ""} onChange={(e) => setForm({ ...form, empresaSite: e.target.value })} placeholder="https://empresa.com.br" className="h-9 text-xs" />
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">LinkedIn da empresa</label>
              <Input value={form.empresaLinkedin || ""} onChange={(e) => setForm({ ...form, empresaLinkedin: e.target.value })} placeholder="linkedin.com/company/..." className="h-9 text-xs" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim block mb-1">O que a empresa faz</label>
            <textarea
              value={form.empresaDescricao || ""}
              onChange={(e) => setForm({ ...form, empresaDescricao: e.target.value })}
              rows={2}
              placeholder="Breve descricao da empresa e area de atuacao..."
              className="w-full rounded-lg bg-bg-elevated border border-[var(--border-color)] px-3 py-2 text-xs text-cream placeholder:text-dim/40 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      <Card>
        <CardContent className="py-5 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-dim">Sobre voce</h3>
          <textarea
            value={form.bio || ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            placeholder="Conte sobre seus interesses, objetivos na liga, experiencias relevantes..."
            className="w-full rounded-lg bg-bg-elevated border border-[var(--border-color)] px-4 py-3 text-sm text-cream placeholder:text-dim/40 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
          />
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar alteracoes
        </Button>
        {saved && <span className="text-sm text-sage">Perfil atualizado</span>}
      </div>
    </div>
  );
}
