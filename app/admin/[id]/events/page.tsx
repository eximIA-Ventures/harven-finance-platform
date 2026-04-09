"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, MapPin, Users, Mic, Plus, X, Trash2, Loader2,
  Check, HelpCircle, XCircle, ChevronDown, Lock, Globe,
  Image as ImageIcon, Video, Link2, UserPlus, FileText, Download, Upload, Paperclip,
} from "lucide-react";

type EventType = "meeting" | "palestra" | "workshop" | "competicao" | "social";
type Visibility = "all" | "personal";
type LocationType = "presencial" | "online" | "hibrido";

interface Attendee { userId: string; name: string | null; avatar: string | null; status: string; }
interface MemberOption { id: string; name: string; email: string; avatarUrl: string | null; memberStatus: string | null; }

interface EventFile { id: string; name: string; fileUrl: string; fileName: string; fileType: string | null; fileSize: number | null; }

interface EventRow {
  id: string; title: string; description: string | null; eventType: string | null;
  location: string | null; startDate: string; endDate: string | null;
  speaker: string | null; speakerTitle: string | null; maxAttendees: number | null;
  imageUrl: string | null; meetingUrl: string | null; locationType: string | null;
  visibility: string | null; createdBy: string | null; createdAt: string;
  attendeeCount: number; attendees: Attendee[]; myStatus: string | null; creatorName: string | null;
  files: EventFile[];
}

const typeLabels: Record<string, string> = { meeting: "Reuniao", palestra: "Palestra", workshop: "Workshop", competicao: "Competicao", social: "Social" };
const typeColors: Record<string, string> = { meeting: "bg-blue-500", palestra: "bg-purple-500", workshop: "bg-amber-500", competicao: "bg-red-500", social: "bg-emerald-500" };
const typeBadgeVariant: Record<string, "default" | "info" | "accent" | "warning"> = { meeting: "default", palestra: "info", workshop: "accent", competicao: "warning", social: "default" };

const inputCls = "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

interface FormState {
  title: string; description: string; event_type: EventType; location: string;
  start_date: string; end_date: string; speaker: string; speaker_title: string;
  max_attendees: string; image_url: string; meeting_url: string;
  location_type: LocationType; visibility: Visibility; invited_user_ids: string[];
}

const emptyForm: FormState = {
  title: "", description: "", event_type: "meeting", location: "",
  start_date: "", end_date: "", speaker: "", speaker_title: "",
  max_attendees: "", image_url: "", meeting_url: "",
  location_type: "presencial", visibility: "all", invited_user_ids: [],
};

// ─── Modal ──────────────────────────────────────────────────────────────────

function CreateEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setForm(emptyForm); setShowMore(false); setAllDay(false); setShowEndDate(false); setMemberSearch(""); } }, [open]);
  useEffect(() => { if (!open) return; const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", fn); return () => window.removeEventListener("keydown", fn); }, [open, onClose]);

  // Fetch members for invite picker
  useEffect(() => {
    if (!open) return;
    fetch("/api/members").then(r => r.ok ? r.json() : []).then(setMembers).catch(() => {});
  }, [open]);

  const handleCreate = async () => {
    if (!form.title || !form.start_date) return;
    setSaving(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null }),
      });
      if (res.ok) { onClose(); onCreated(); }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const toggleInvite = (id: string) => {
    setForm(f => ({
      ...f,
      invited_user_ids: f.invited_user_ids.includes(id)
        ? f.invited_user_ids.filter(x => x !== id)
        : [...f.invited_user_ids, id],
    }));
  };

  const filteredMembers = members.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()) || m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const showSpeaker = ["palestra", "workshop"].includes(form.event_type);
  const showCompetition = form.event_type === "competicao";
  const showMaxAttendees = ["palestra", "workshop", "competicao"].includes(form.event_type);

  const ROLE_OPTIONS = [
    { key: "presidente", label: "Presidentes" },
    { key: "vice-presidente", label: "Vice-Presidentes" },
    { key: "trainee", label: "Trainees" },
  ];

  const inviteByRole = (role: string) => {
    const roleMembers = members.filter(m => m.memberStatus === role);
    const newIds = new Set(form.invited_user_ids);
    roleMembers.forEach(m => newIds.add(m.id));
    setForm(f => ({ ...f, invited_user_ids: Array.from(newIds) }));
  };

  const inviteAll = () => {
    setForm(f => ({ ...f, invited_user_ids: members.map(m => m.id) }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div ref={backdropRef} className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={(e) => { if (e.target === backdropRef.current) onClose(); }} style={{ animation: "modal-fade 0.2s ease-out" }} />

      <div className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto" style={{ animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)]">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-bg-card rounded-t-2xl border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${typeColors[form.event_type]}`} />
              <h2 className="text-lg font-semibold text-cream truncate max-w-[300px]">{form.title || "Novo Evento"}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Title */}
            <input autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titulo do evento" className="w-full text-xl font-medium text-cream bg-transparent border-none outline-none placeholder:text-dim/40" />

            {/* Type pills */}
            <div className="flex gap-2 flex-wrap">
              {(["meeting", "palestra", "workshop", "competicao", "social"] as const).map(t => (
                <button key={t} onClick={() => setForm({ ...form, event_type: t })} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${form.event_type === t ? `${typeColors[t]} text-white` : "bg-bg-elevated text-dim hover:text-cream"}`}>
                  {typeLabels[t]}
                </button>
              ))}
            </div>

            {/* Date/Time */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  {/* All day toggle */}
                  <button onClick={() => { setAllDay(!allDay); if (!allDay) setForm(f => ({ ...f, start_date: f.start_date.split("T")[0] || "", end_date: f.end_date.split("T")[0] || "" })); }} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex-shrink-0 ${allDay ? "bg-accent/15 text-accent border border-accent/20" : "bg-bg-elevated text-dim border border-[var(--border-color)] hover:text-cream"}`}>
                    Dia inteiro
                  </button>
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">{showEndDate ? "Inicio" : "Data"}</label>
                    <input type={allDay ? "date" : "datetime-local"} value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* End date — toggleable */}
              {showEndDate ? (
                <div className="flex items-center gap-3 ml-7">
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">Fim</label>
                    <input type={allDay ? "date" : "datetime-local"} value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
                  </div>
                  <button onClick={() => { setShowEndDate(false); setForm(f => ({ ...f, end_date: "" })); }} className="p-1.5 text-dim hover:text-red-400 transition-colors mt-4" title="Remover data de fim">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowEndDate(true)} className="ml-7 text-xs text-accent hover:text-accent-hover transition-colors">
                  + Adicionar data de fim
                </button>
              )}
            </div>

            {/* Location type toggle + field */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="flex gap-1.5 p-0.5 bg-bg-elevated rounded-lg">
                  {(["presencial", "online", "hibrido"] as const).map(lt => (
                    <button key={lt} onClick={() => setForm({ ...form, location_type: lt })} className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${form.location_type === lt ? "bg-bg-card text-cream shadow-sm" : "text-dim hover:text-cream"}`}>
                      {lt === "presencial" ? "Presencial" : lt === "online" ? "Online" : "Hibrido"}
                    </button>
                  ))}
                </div>
              </div>

              {(form.location_type === "presencial" || form.location_type === "hibrido") && (
                <div className="flex items-center gap-3 ml-7">
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Sala, auditorio, endereco..." className={inputCls} />
                </div>
              )}

              {(form.location_type === "online" || form.location_type === "hibrido") && (
                <div className="flex items-center gap-3 ml-7">
                  <Link2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <input value={form.meeting_url} onChange={e => setForm({ ...form, meeting_url: e.target.value })} placeholder="Link da reuniao (Zoom, Meet, Teams...)" className={inputCls} />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex items-start gap-3">
              <div className="w-4 h-4 mt-2.5 flex-shrink-0 text-accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" /></svg>
              </div>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Adicionar notas ou descricao" rows={2} className={`${inputCls} resize-none`} />
            </div>

            {/* More options toggle */}
            <button onClick={() => setShowMore(!showMore)} className="flex items-center gap-2 text-xs text-dim hover:text-cream transition-colors">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMore ? "rotate-180" : ""}`} />
              {showMore ? "Menos opcoes" : "Mais opcoes"}
            </button>

            {showMore && (
              <div className="space-y-3 pt-1 border-t border-[var(--border-color)]">
                {/* Speaker — only for palestra/workshop */}
                {showSpeaker && (
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4 text-accent flex-shrink-0" />
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input value={form.speaker} onChange={e => setForm({ ...form, speaker: e.target.value })} placeholder="Palestrante" className={inputCls} />
                      <input value={form.speaker_title} onChange={e => setForm({ ...form, speaker_title: e.target.value })} placeholder="Titulo (Prof., Dr.)" className={inputCls} />
                    </div>
                  </div>
                )}

                {/* Competition — organizer */}
                {showCompetition && (
                  <div className="flex items-center gap-3">
                    <Mic className="w-4 h-4 text-accent flex-shrink-0" />
                    <input value={form.speaker} onChange={e => setForm({ ...form, speaker: e.target.value })} placeholder="Organizador / Instituicao" className={inputCls} />
                  </div>
                )}

                {/* Max attendees — only for palestra/workshop/competicao */}
                {showMaxAttendees && (
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-accent flex-shrink-0" />
                    <input type="number" value={form.max_attendees} onChange={e => setForm({ ...form, max_attendees: e.target.value })} placeholder="Limite de vagas (ilimitado)" className={inputCls} />
                  </div>
                )}

                {/* Image */}
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-4 h-4 text-accent flex-shrink-0" />
                  <input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="URL da imagem de capa" className={inputCls} />
                </div>

                {form.image_url && (
                  <div className="rounded-xl overflow-hidden h-32 bg-bg-elevated ml-7">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}

                {/* Visibility */}
                <div className="flex items-center gap-3">
                  {form.visibility === "all" ? <Globe className="w-4 h-4 text-accent flex-shrink-0" /> : <Lock className="w-4 h-4 text-accent flex-shrink-0" />}
                  <div className="flex gap-2">
                    {(["all", "personal"] as const).map(v => (
                      <button key={v} onClick={() => setForm({ ...form, visibility: v, invited_user_ids: v === "all" ? [] : form.invited_user_ids })} className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${form.visibility === v ? "bg-accent/15 text-accent border border-accent/20" : "bg-bg-elevated text-dim border border-[var(--border-color)] hover:text-cream"}`}>
                        {v === "all" ? "Todos" : "Convidados"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Invite picker — when "Convidados" selected */}
                {form.visibility === "personal" && (
                  <div className="ml-7 space-y-3">
                    {/* Quick invite by role */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-dim">Convidar por cargo</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button onClick={inviteAll} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)] hover:text-cream hover:border-accent/20 transition-all">
                          Todos
                        </button>
                        {ROLE_OPTIONS.map(r => (
                          <button key={r.key} onClick={() => inviteByRole(r.key)} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-bg-elevated text-dim border border-[var(--border-color)] hover:text-cream hover:border-accent/20 transition-all">
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-accent" />
                      <input value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar membro..." className={`${inputCls} text-xs`} />
                    </div>

                    {/* Selected pills */}
                    {form.invited_user_ids.length > 0 && (
                      <div>
                        <span className="text-[10px] text-dim">{form.invited_user_ids.length} convidado(s)</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {form.invited_user_ids.map(uid => {
                            const m = members.find(x => x.id === uid);
                            return (
                              <span key={uid} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent text-[11px] font-medium">
                                {m?.name || uid}
                                <button onClick={() => toggleInvite(uid)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Member list */}
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-bg-elevated divide-y divide-[var(--border-color)]">
                      {filteredMembers.length === 0 ? (
                        <p className="text-xs text-dim text-center py-3">Nenhum membro encontrado</p>
                      ) : (
                        filteredMembers.map(m => {
                          const selected = form.invited_user_ids.includes(m.id);
                          return (
                            <button key={m.id} onClick={() => toggleInvite(m.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${selected ? "bg-accent/5" : "hover:bg-bg-card"}`}>
                              {m.avatarUrl ? (
                                <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent font-medium">{m.name[0].toUpperCase()}</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className="text-xs text-cream block truncate">{m.name}</span>
                                <span className="text-[10px] text-dim block truncate">{m.memberStatus || "membro"} · {m.email}</span>
                              </div>
                              {selected && <Check className="w-4 h-4 text-accent flex-shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer — sticky */}
          <div className="sticky bottom-0 bg-bg-card border-t border-[var(--border-color)] px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
            <button onClick={onClose} className="px-4 py-2 text-sm text-dim hover:text-cream transition-colors">Cancelar</button>
            <button onClick={handleCreate} disabled={!form.title || !form.start_date || saving} className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar Evento
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modal-scale { from { opacity: 0; transform: scale(0.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>
  );
}

// ─── Event Detail Modal ────────────────────────────────────────────────────

function EventDetailModal({
  event,
  onClose,
  onRespond,
  onFileUploaded,
  respondingTo,
  isAdmin,
  currentUserId,
}: {
  event: EventRow;
  onClose: () => void;
  onRespond: (eventId: string, status: "confirmed" | "maybe" | "declined") => void;
  onFileUploaded: () => void;
  respondingTo: string | null;
  isAdmin: boolean;
  currentUserId: string | null;
}) {
  const canManageFiles = isAdmin || event.createdBy === currentUserId;
  const [uploading, setUploading] = useState(false);
  const typeKey = event.eventType || "meeting";
  const isOnline = event.locationType === "online" || event.locationType === "hibrido";
  const startD = new Date(event.startDate);
  const confirmed = event.attendees.filter(a => a.status === "confirmed").length;
  const maybeCount = event.attendees.filter(a => a.status === "maybe").length;
  const declined = event.attendees.filter(a => a.status === "declined").length;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload/journey", { method: "POST", body: fd });
      if (!uploadRes.ok) return;
      const { url, fileName, fileType, fileSize } = await uploadRes.json();
      await fetch(`/api/events/${event.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name.replace(/\.[^.]+$/, ""), fileUrl: url, fileName, fileType, fileSize }),
      });
      onFileUploaded();
    } catch { /* silent */ }
    finally { setUploading(false); }
  };

  const handleDeleteFile = async (fileId: string) => {
    await fetch(`/api/events/${event.id}/files?fileId=${fileId}`, { method: "DELETE" });
    onFileUploaded();
  };

  const fmtSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} style={{ animation: "modal-fade 0.2s ease-out" }} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto" style={{ animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)] overflow-hidden">
          {/* Color bar */}
          <div className={`h-1.5 ${typeColors[typeKey]}`} />

          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-[var(--border-color)]">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant={typeBadgeVariant[typeKey] || "default"}>{typeLabels[typeKey] || typeKey}</Badge>
                  {event.visibility === "personal" && <Badge variant="default"><Lock className="w-3 h-3 mr-1" />Convidados</Badge>}
                  {isOnline && <Badge variant="info"><Video className="w-3 h-3 mr-1" />Online</Badge>}
                </div>
                <h2 className="text-xl font-semibold text-cream">{event.title}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Date/Time/Location row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated">
                <Calendar className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <p className="text-[10px] text-dim uppercase tracking-wider">Data</p>
                  <p className="text-sm text-cream">{startD.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated">
                <Clock className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <p className="text-[10px] text-dim uppercase tracking-wider">Horario</p>
                  <p className="text-sm text-cream">
                    {startD.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    {event.endDate && ` — ${new Date(event.endDate).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated">
                  <MapPin className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <p className="text-[10px] text-dim uppercase tracking-wider">Local</p>
                    <p className="text-sm text-cream">{event.location}</p>
                  </div>
                </div>
              )}
              {event.speaker && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated">
                  <Mic className="w-4 h-4 text-accent shrink-0" />
                  <div>
                    <p className="text-[10px] text-dim uppercase tracking-wider">Palestrante</p>
                    <p className="text-sm text-cream">{event.speakerTitle ? `${event.speakerTitle} — ` : ""}{event.speaker}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Meeting URL */}
            {event.meetingUrl && (
              <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 text-accent hover:bg-accent/15 transition-colors text-sm font-medium">
                <Video className="w-4 h-4" /> Entrar na reuniao online
              </a>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-2">Descricao</h3>
                <p className="text-sm text-cream/80 leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>
            )}

            {/* RSVP */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">Sua Presenca</h3>
              <div className="flex items-center gap-2">
                {respondingTo === event.id ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : (
                  <>
                    <button onClick={() => onRespond(event.id, "confirmed")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${event.myStatus === "confirmed" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-bg-elevated text-dim hover:text-emerald-400"}`}>
                      <Check className="w-4 h-4" /> Confirmar
                    </button>
                    <button onClick={() => onRespond(event.id, "maybe")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${event.myStatus === "maybe" ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30" : "bg-bg-elevated text-dim hover:text-amber-400"}`}>
                      <HelpCircle className="w-4 h-4" /> Talvez
                    </button>
                    <button onClick={() => onRespond(event.id, "declined")} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${event.myStatus === "declined" ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-bg-elevated text-dim hover:text-red-400"}`}>
                      <XCircle className="w-4 h-4" /> Recusar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim flex items-center gap-1.5">
                  <Paperclip className="w-3 h-3" /> Anexos ({event.files?.length || 0})
                </h3>
                {canManageFiles && (
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-lg text-xs font-medium hover:bg-accent/20 transition-colors cursor-pointer">
                    <Upload className="w-3 h-3" />
                    {uploading ? "Enviando..." : "Anexar"}
                    <input type="file" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
                  </label>
                )}
              </div>
              {event.files && event.files.length > 0 ? (
                <div className="space-y-2">
                  {event.files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated ring-1 ring-[var(--border-color)] group">
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cream font-medium truncate">{f.name}</p>
                        <p className="text-[10px] text-dim">{f.fileName}{f.fileSize ? ` · ${fmtSize(f.fileSize)}` : ""}</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(f.fileUrl);
                            const blob = await res.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = f.fileName || f.name;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          } catch { window.open(f.fileUrl, "_blank"); }
                        }}
                        className="p-2 rounded-lg text-dim hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      {canManageFiles && (
                        <button onClick={() => handleDeleteFile(f.id)} className="p-2 rounded-lg text-dim hover:text-red-400 hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dim/50 text-center py-3">Nenhum anexo</p>
              )}
            </div>

            {/* Participants */}
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim mb-3">
                Participantes ({event.attendees.length})
                <span className="ml-2 font-normal">
                  <span className="text-emerald-400">{confirmed} confirmados</span>
                  {maybeCount > 0 && <span className="text-amber-400"> · {maybeCount} talvez</span>}
                  {declined > 0 && <span className="text-red-400"> · {declined} recusados</span>}
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {event.attendees.map(a => (
                  <div key={a.userId} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-bg-elevated">
                    {a.avatar
                      ? <img src={a.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      : <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-[10px] text-accent font-bold">{(a.name || "?")[0].toUpperCase()}</div>
                    }
                    <span className="text-xs text-cream truncate flex-1">{a.name || "—"}</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${a.status === "confirmed" ? "bg-emerald-400" : a.status === "maybe" ? "bg-amber-400" : a.status === "declined" ? "bg-red-400" : "bg-blue-400"}`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Creator */}
            {event.creatorName && (
              <p className="text-[10px] text-dim text-right">Criado por {event.creatorName}</p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modal-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modal-scale { from { opacity: 0; transform: scale(0.96) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getEventEnd(e: { startDate: string; endDate: string | null }): string {
  if (e.endDate) return e.endDate;
  const d = new Date(e.startDate);
  d.setHours(d.getHours() + 2);
  return d.toISOString();
}

function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function isThisWeek(d: Date, now: Date) {
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const end = new Date(start); end.setDate(start.getDate() + 7);
  return d >= start && d < end;
}

// ─── Mini Calendar ─────────────────────────────────────────────────────────

function MiniCalendar({ events, selectedDate, onSelect }: { events: EventRow[]; selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventDates = new Set(events.map(e => {
    const d = new Date(e.startDate);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewMonth(new Date(year, month - 1))} className="p-1 text-dim hover:text-cream transition-colors">←</button>
        <span className="text-sm font-semibold text-cream">{monthNames[month]} {year}</span>
        <button onClick={() => setViewMonth(new Date(year, month + 1))} className="p-1 text-dim hover:text-cream transition-colors">→</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span key={i} className="text-[9px] text-dim/50 font-medium py-1">{d}</span>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const date = new Date(year, month, day);
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasEvent = eventDates.has(`${year}-${month}-${day}`);
          return (
            <button
              key={i}
              onClick={() => onSelect(date)}
              className={`relative w-8 h-8 rounded-lg text-xs font-medium transition-all mx-auto
                ${isSelected ? "bg-accent text-white" : isToday ? "bg-accent/15 text-accent font-bold" : "text-cream hover:bg-bg-elevated"}`}
            >
              {day}
              {hasEvent && !isSelected && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"upcoming" | "past" | "day">("upcoming");
  const [showModal, setShowModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<EventRow | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) setEvents(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(u => {
      if (u) { setCurrentUserId(u.id); setIsAdmin((u.permissions || []).includes("admin")); }
    });
  }, []);

  const now = new Date();
  const nowIso = now.toISOString();

  // Filter using end time
  const isUpcoming = (e: EventRow) => getEventEnd(e) >= nowIso;
  const filtered = (() => {
    let list = events;
    if (view === "upcoming") list = events.filter(isUpcoming).sort((a, b) => a.startDate.localeCompare(b.startDate));
    else if (view === "past") list = events.filter(e => !isUpcoming(e)).sort((a, b) => b.startDate.localeCompare(a.startDate));
    else if (view === "day") list = events.filter(e => isSameDay(new Date(e.startDate), selectedDate)).sort((a, b) => a.startDate.localeCompare(b.startDate));
    if (typeFilter !== "all") list = list.filter(e => (e.eventType || "meeting") === typeFilter);
    return list;
  })();

  // Group upcoming by: Today, This Week, Later
  const grouped = (() => {
    if (view !== "upcoming") return null;
    const today: EventRow[] = [];
    const thisWeek: EventRow[] = [];
    const later: EventRow[] = [];
    for (const e of filtered) {
      const d = new Date(e.startDate);
      if (isSameDay(d, now)) today.push(e);
      else if (isThisWeek(d, now)) thisWeek.push(e);
      else later.push(e);
    }
    return [
      { label: "Hoje", items: today, color: "bg-accent" },
      { label: "Esta Semana", items: thisWeek, color: "bg-sage" },
      { label: "Próximos", items: later, color: "bg-atom" },
    ].filter(g => g.items.length > 0);
  })();

  const handleDelete = async (eventId: string) => {
    if (!confirm("Remover este evento?")) return;
    try { const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" }); if (res.ok) setEvents(prev => prev.filter(e => e.id !== eventId)); } catch { /* silent */ }
  };

  const handleRespond = async (eventId: string, status: "confirmed" | "maybe" | "declined") => {
    setRespondingTo(eventId);
    try { const res = await fetch(`/api/events/${eventId}/attend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (res.ok) await fetchEvents(); } catch { /* silent */ }
    finally { setRespondingTo(null); }
  };

  const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
  const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }); } catch { return ""; } };
  const confirmed = (e: EventRow) => e.attendees.filter(a => a.status === "confirmed").length;
  const maybe = (e: EventRow) => e.attendees.filter(a => a.status === "maybe").length;
  const upcomingCount = events.filter(isUpcoming).length;
  const pastCount = events.filter(e => !isUpcoming(e)).length;

  const typeColorDot: Record<string, string> = { meeting: "bg-blue-400", palestra: "bg-purple-400", workshop: "bg-amber-400", competicao: "bg-red-400", social: "bg-emerald-400" };

  const renderEventCard = (event: EventRow) => {
    const isPast = !isUpcoming(event);
    const isFull = event.maxAttendees != null && confirmed(event) >= event.maxAttendees;
    const typeKey = event.eventType || "meeting";
    const isExpanded = expandedEvent === event.id;
    const isOnline = event.locationType === "online" || event.locationType === "hibrido";
    const startD = new Date(event.startDate);
    const isToday = isSameDay(startD, now);

    return (
      <div
        key={event.id}
        onClick={() => setDetailEvent(event)}
        className={`group rounded-xl ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] overflow-hidden cursor-pointer ${isToday && !isPast ? "ring-accent/30 bg-accent/[0.03]" : "ring-[var(--border-color)] bg-bg-card"} ${isPast ? "opacity-60" : ""}`}
      >
        {/* Color bar top */}
        <div className={`h-1 ${typeColors[typeKey]}`} />

        {/* User status banner */}
        {event.myStatus === "confirmed" && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/10">
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-[11px] text-emerald-400 font-medium">Presença confirmada</span>
          </div>
        )}
        {event.myStatus === "maybe" && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/10">
            <HelpCircle className="w-3 h-3 text-amber-400" />
            <span className="text-[11px] text-amber-400 font-medium">Talvez</span>
          </div>
        )}
        {event.myStatus === "declined" && (
          <div className="flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border-b border-red-500/10">
            <XCircle className="w-3 h-3 text-red-400" />
            <span className="text-[11px] text-red-400 font-medium">Presença recusada</span>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Date block */}
            <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isToday ? "bg-accent/15 ring-1 ring-accent/20" : "bg-bg-elevated"}`}>
              <span className={`text-[8px] uppercase font-bold ${isToday ? "text-accent" : "text-dim"}`}>
                {startD.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
              </span>
              <span className="text-xl font-bold text-cream leading-none">{startD.getDate()}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-sm font-semibold text-cream">{event.title}</h3>
                {isToday && !isPast && <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">HOJE</span>}
                <span className={`w-2 h-2 rounded-full ${typeColorDot[typeKey] || "bg-dim"}`} title={typeLabels[typeKey]} />
                <span className="text-[10px] text-dim">{typeLabels[typeKey]}</span>
                {event.visibility === "personal" && <Lock className="w-3 h-3 text-dim" />}
                {isOnline && <Video className="w-3 h-3 text-blue-400" />}
              </div>

              {/* Time & Location row */}
              <div className="flex items-center gap-4 text-[11px] text-dim flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {fmtTime(event.startDate)}{event.endDate ? ` — ${fmtTime(event.endDate)}` : ""}
                </span>
                {event.location && (
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                )}
                {event.meetingUrl && (
                  <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-accent hover:underline"><Link2 className="w-3 h-3" />Entrar</a>
                )}
                {event.speaker && (
                  <span className="inline-flex items-center gap-1"><Mic className="w-3 h-3" />{event.speaker}</span>
                )}
              </div>

              {event.description && <p className="text-[11px] text-dim/70 mt-1.5 line-clamp-1">{event.description}</p>}

              {/* Attendees row */}
              <div className="flex items-center gap-3 mt-2.5">
                {/* Avatar stack */}
                {event.attendees.length > 0 && (
                  <div className="flex -space-x-1.5">
                    {event.attendees.slice(0, 5).map(a => (
                      a.avatar
                        ? <img key={a.userId} src={a.avatar} alt="" className="w-6 h-6 rounded-full object-cover ring-2 ring-bg-card" />
                        : <div key={a.userId} className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-[8px] text-accent font-bold ring-2 ring-bg-card">{(a.name || "?")[0].toUpperCase()}</div>
                    ))}
                    {event.attendees.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-bg-elevated flex items-center justify-center text-[8px] text-dim font-medium ring-2 ring-bg-card">+{event.attendees.length - 5}</div>
                    )}
                  </div>
                )}
                <span className="text-[10px] text-emerald-400 font-medium">{confirmed(event)} confirmados</span>
                {maybe(event) > 0 && <span className="text-[10px] text-amber-400">{maybe(event)} talvez</span>}
                {event.creatorName && <span className="text-[10px] text-dim ml-auto">por {event.creatorName}</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {!isPast && (
                <div className="flex items-center gap-1">
                  {respondingTo === event.id ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : (
                    <>
                      <button onClick={(ev) => { ev.stopPropagation(); handleRespond(event.id, "confirmed"); }} disabled={isFull && event.myStatus !== "confirmed"} className={`p-1.5 rounded-lg transition-colors ${event.myStatus === "confirmed" ? "bg-emerald-500/15 text-emerald-400" : "text-dim/40 hover:text-emerald-400 hover:bg-emerald-500/10"}`} title="Confirmar"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={(ev) => { ev.stopPropagation(); handleRespond(event.id, "maybe"); }} className={`p-1.5 rounded-lg transition-colors ${event.myStatus === "maybe" ? "bg-amber-500/15 text-amber-400" : "text-dim/40 hover:text-amber-400 hover:bg-amber-500/10"}`} title="Talvez"><HelpCircle className="w-3.5 h-3.5" /></button>
                      <button onClick={(ev) => { ev.stopPropagation(); handleRespond(event.id, "declined"); }} className={`p-1.5 rounded-lg transition-colors ${event.myStatus === "declined" ? "bg-red-500/15 text-red-400" : "text-dim/40 hover:text-red-400 hover:bg-red-500/10"}`} title="Recusar"><XCircle className="w-3.5 h-3.5" /></button>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-0.5">
                <button onClick={(ev) => { ev.stopPropagation(); setExpandedEvent(isExpanded ? null : event.id); }} className="p-1 text-dim/40 hover:text-cream transition-colors"><ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                <button onClick={(ev) => { ev.stopPropagation(); handleDelete(event.id); }} className="p-1 text-dim/40 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>

          {/* Expanded attendees */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-dim block mb-2">Participantes ({event.attendees.length})</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {event.attendees.map(a => (
                  <div key={a.userId} className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated">
                    {a.avatar ? <img src={a.avatar} alt="" className="w-5 h-5 rounded-full object-cover" /> : <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[8px] text-accent font-medium">{(a.name || "?")[0].toUpperCase()}</div>}
                    <span className="text-[11px] text-cream truncate flex-1">{a.name || "—"}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.status === "confirmed" ? "bg-emerald-400" : a.status === "maybe" ? "bg-amber-400" : a.status === "declined" ? "bg-red-400" : "bg-blue-400"}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Agenda</h2>
          <p className="text-dim text-sm mt-1">{loading ? "Carregando..." : `${upcomingCount} próximos · ${pastCount} passados`}</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Novo Evento</Button>
      </div>

      <CreateEventModal open={showModal} onClose={() => setShowModal(false)} onCreated={fetchEvents} />

      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onRespond={(id, status) => { handleRespond(id, status); }}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onFileUploaded={async () => {
            const res = await fetch("/api/events");
            if (res.ok) {
              const updated = await res.json();
              setEvents(updated);
              setDetailEvent(prev => prev ? updated.find((e: EventRow) => e.id === prev.id) || prev : null);
            }
          }}
          respondingTo={respondingTo}
        />
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-4">
          {/* Mini Calendar */}
          <MiniCalendar events={events} selectedDate={selectedDate} onSelect={(d) => { setSelectedDate(d); setView("day"); }} />

          {/* View tabs */}
          <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card overflow-hidden">
            {([
              { key: "upcoming" as const, label: "Próximos", count: upcomingCount },
              { key: "past" as const, label: "Passados", count: pastCount },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${view === t.key ? "bg-accent/10 text-accent font-medium" : "text-dim hover:text-cream hover:bg-bg-elevated"}`}
              >
                <span>{t.label}</span>
                <span className={`text-[10px] font-mono ${view === t.key ? "text-accent" : "text-dim/50"}`}>{t.count}</span>
              </button>
            ))}
          </div>

          {/* Type filters */}
          <div className="rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card p-3 space-y-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-dim block mb-2">Tipo</span>
            <button onClick={() => setTypeFilter("all")} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${typeFilter === "all" ? "bg-accent/10 text-accent font-medium" : "text-dim hover:text-cream"}`}>
              <span className="w-2 h-2 rounded-full bg-dim" /> Todos
            </button>
            {Object.entries(typeLabels).map(([key, label]) => (
              <button key={key} onClick={() => setTypeFilter(key)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${typeFilter === key ? "bg-accent/10 text-accent font-medium" : "text-dim hover:text-cream"}`}>
                <span className={`w-2 h-2 rounded-full ${typeColorDot[key]}`} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Day view header */}
          {view === "day" && (
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setView("upcoming")} className="text-xs text-accent hover:underline">← Voltar</button>
              <h3 className="text-sm font-semibold text-cream">
                {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h3>
              {isSameDay(selectedDate, now) && <span className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded">HOJE</span>}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-accent" /><span className="ml-2 text-sm text-dim">Carregando...</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16 rounded-xl ring-1 ring-[var(--border-color)] bg-bg-card">
              <Calendar className="w-10 h-10 text-dim/30 mx-auto mb-3" />
              <p className="text-dim text-sm">Nenhum evento {view === "upcoming" ? "próximo" : view === "past" ? "passado" : "neste dia"}</p>
              {view === "day" && <button onClick={() => { setShowModal(true); }} className="text-xs text-accent hover:underline mt-2">Criar evento para este dia</button>}
            </div>
          )}

          {!loading && view === "upcoming" && grouped && (
            <div className="space-y-6">
              {grouped.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${group.color}`} />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-dim">{group.label}</h3>
                    <span className="text-[10px] text-dim/40">{group.items.length}</span>
                    <div className="flex-1 border-t border-[var(--border-color)] ml-1" />
                  </div>
                  <div className="space-y-3">
                    {group.items.map(renderEventCard)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (view === "past" || view === "day") && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map(renderEventCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
