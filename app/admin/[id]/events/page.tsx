"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar, Clock, MapPin, Users, Mic, Plus, X, Trash2, Loader2,
  Check, HelpCircle, XCircle, ChevronDown, Lock, Globe,
  Image as ImageIcon, Video, Link2, UserPlus,
} from "lucide-react";

type EventType = "meeting" | "palestra" | "workshop" | "competicao" | "social";
type Visibility = "all" | "personal";
type LocationType = "presencial" | "online" | "hibrido";

interface Attendee { userId: string; name: string | null; avatar: string | null; status: string; }
interface MemberOption { id: string; name: string; email: string; avatarUrl: string | null; memberStatus: string | null; }

interface EventRow {
  id: string; title: string; description: string | null; eventType: string | null;
  location: string | null; startDate: string; endDate: string | null;
  speaker: string | null; speakerTitle: string | null; maxAttendees: number | null;
  imageUrl: string | null; meetingUrl: string | null; locationType: string | null;
  visibility: string | null; createdBy: string | null; createdAt: string;
  attendeeCount: number; attendees: Attendee[]; myStatus: string | null; creatorName: string | null;
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
      <div ref={backdropRef} className="absolute inset-0 bg-black/25 backdrop-blur-[6px]" onClick={(e) => { if (e.target === backdropRef.current) onClose(); }} style={{ animation: "modal-fade 0.2s ease-out" }} />

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

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [showModal, setShowModal] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) setEvents(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const now = new Date().toISOString();
  const filtered = events.filter(e => tab === "upcoming" ? e.startDate >= now : e.startDate < now);

  const handleDelete = async (eventId: string) => {
    if (!confirm("Remover este evento?")) return;
    try { const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" }); if (res.ok) setEvents(prev => prev.filter(e => e.id !== eventId)); } catch { /* silent */ }
  };

  const handleRespond = async (eventId: string, status: "confirmed" | "maybe" | "declined") => {
    setRespondingTo(eventId);
    try { const res = await fetch(`/api/events/${eventId}/attend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); if (res.ok) await fetchEvents(); } catch { /* silent */ }
    finally { setRespondingTo(null); }
  };

  const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => { try { return new Date(iso).toLocaleDateString("pt-BR", opts); } catch { return ""; } };
  const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };

  const upcomingCount = events.filter(e => e.startDate >= now).length;
  const pastCount = events.filter(e => e.startDate < now).length;
  const confirmed = (e: EventRow) => e.attendees.filter(a => a.status === "confirmed").length;
  const maybe = (e: EventRow) => e.attendees.filter(a => a.status === "maybe").length;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Agenda</h2>
          <p className="text-dim text-sm mt-1">{loading ? "Carregando..." : `${upcomingCount} proximos · ${pastCount} passados`}</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" />Novo Evento</Button>
      </div>

      <CreateEventModal open={showModal} onClose={() => setShowModal(false)} onCreated={fetchEvents} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-bg-elevated border border-[var(--border-color)] rounded-lg w-fit">
        {(["upcoming", "past"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 text-sm rounded-md transition-all duration-150 ${tab === t ? "bg-accent text-white font-medium" : "text-dim hover:text-cream"}`}>
            {t === "upcoming" ? "Proximos" : "Passados"}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-accent" /><span className="ml-2 text-sm text-dim">Carregando agenda...</span>
        </div>
      )}

      {!loading && (
        <div className="grid gap-4">
          {filtered.length === 0 && (
            <Card><CardContent><p className="text-dim text-sm text-center py-4">Nenhum evento {tab === "upcoming" ? "proximo" : "passado"} encontrado.</p></CardContent></Card>
          )}

          {filtered.map(event => {
            const isPast = event.startDate < now;
            const isFull = event.maxAttendees != null && confirmed(event) >= event.maxAttendees;
            const typeKey = event.eventType || "meeting";
            const isExpanded = expandedEvent === event.id;
            const isOnline = event.locationType === "online" || event.locationType === "hibrido";

            return (
              <Card key={event.id} className="overflow-hidden transition-colors">
                {event.imageUrl && (
                  <div className="h-40 overflow-hidden"><img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" /></div>
                )}
                <CardContent className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    <div className="flex-shrink-0 relative">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full ${typeColors[typeKey]}`} />
                      <div className="w-16 h-16 flex flex-col items-center justify-center bg-accent/10 rounded-xl ml-1">
                        <span className="text-xs font-semibold uppercase text-accent">{fmt(event.startDate, { month: "short" })}</span>
                        <span className="text-xl font-bold font-mono text-cream">{new Date(event.startDate).getDate()}</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-cream">{event.title}</h3>
                        <Badge variant={typeBadgeVariant[typeKey] || "default"}>{typeLabels[typeKey] || typeKey}</Badge>
                        {event.visibility === "personal" && <Badge variant="default"><Lock className="w-3 h-3 mr-1" />Convidados</Badge>}
                        {isOnline && <Badge variant="info"><Video className="w-3 h-3 mr-1" />Online</Badge>}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-dim flex-wrap">
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{fmt(event.startDate, { weekday: "short", day: "numeric", month: "short" })} · {fmtTime(event.startDate)}{event.endDate && ` – ${fmtTime(event.endDate)}`}</span>
                        {event.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                        {event.meetingUrl && <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline"><Link2 className="w-3 h-3" />Entrar na reuniao</a>}
                        {event.speaker && <span className="inline-flex items-center gap-1"><Mic className="w-3 h-3" />{event.speakerTitle ? `${event.speakerTitle} ` : ""}{event.speaker}</span>}
                      </div>

                      {event.description && <p className="text-xs text-dim line-clamp-2">{event.description}</p>}

                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="w-3 h-3" />{confirmed(event)} confirmados</span>
                        {maybe(event) > 0 && <span className="inline-flex items-center gap-1 text-amber-400"><HelpCircle className="w-3 h-3" />{maybe(event)} talvez</span>}
                        {event.maxAttendees && <span className="text-dim">/ {event.maxAttendees} vagas</span>}
                        {event.creatorName && <span className="text-dim ml-auto">por {event.creatorName}</span>}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      {!isPast && (
                        <div className="flex items-center gap-1.5">
                          {respondingTo === event.id ? <Loader2 className="w-4 h-4 animate-spin text-accent" /> : (
                            <>
                              <button onClick={() => handleRespond(event.id, "confirmed")} disabled={isFull && event.myStatus !== "confirmed"} className={`p-2 rounded-lg border transition-colors ${event.myStatus === "confirmed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-[var(--border-color)] text-dim hover:border-emerald-500/20 hover:text-emerald-400"}`} title="Confirmar"><Check className="w-4 h-4" /></button>
                              <button onClick={() => handleRespond(event.id, "maybe")} className={`p-2 rounded-lg border transition-colors ${event.myStatus === "maybe" ? "border-amber-500/30 bg-amber-500/10 text-amber-400" : "border-[var(--border-color)] text-dim hover:border-amber-500/20 hover:text-amber-400"}`} title="Talvez"><HelpCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleRespond(event.id, "declined")} className={`p-2 rounded-lg border transition-colors ${event.myStatus === "declined" ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-[var(--border-color)] text-dim hover:border-red-500/20 hover:text-red-400"}`} title="Recusar"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <button onClick={() => setExpandedEvent(isExpanded ? null : event.id)} className="p-1.5 text-dim hover:text-cream transition-colors"><ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>
                        <button onClick={() => handleDelete(event.id)} className="p-1.5 text-dim hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pt-3 border-t border-[var(--border-color)]">
                      {event.attendees.length > 0 ? (
                        <>
                          <span className="text-xs font-medium text-cream/80 block mb-2">Participantes</span>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {event.attendees.map(a => (
                              <div key={a.userId} className="flex items-center gap-2 p-2 rounded-lg bg-bg-elevated">
                                {a.avatar ? <img src={a.avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] text-accent font-medium">{(a.name || "?")[0].toUpperCase()}</div>}
                                <span className="text-xs text-cream truncate flex-1">{a.name || "—"}</span>
                                <span className={`w-2 h-2 rounded-full ${a.status === "confirmed" ? "bg-emerald-400" : a.status === "maybe" ? "bg-amber-400" : a.status === "declined" ? "bg-red-400" : a.status === "invited" ? "bg-blue-400" : "bg-dim"}`} />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-dim text-center py-2">Nenhum participante ainda.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
