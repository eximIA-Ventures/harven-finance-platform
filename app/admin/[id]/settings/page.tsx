"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Save, CheckCircle, XCircle, RotateCcw } from "lucide-react";

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/evaluations/${id}/data`)
      .then((r) => r.json())
      .then((d) => {
        setName(d.name || "");
        setDescription(d.description || "");
        setInstructions(d.instructions || "");
        setDeadline(d.deadline || "");
        setStatus(d.status || "draft");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaving(true);
    setSuccess(null);
    try {
      const res = await fetch(`/api/evaluations/${id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, instructions, deadline, status }),
      });
      if (res.ok) {
        setSuccess("Configuracoes salvas com sucesso");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setSaving(true);
    setSuccess(null);
    try {
      const res = await fetch(`/api/evaluations/${id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, instructions, deadline, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        const label = newStatus === "completed" ? "Processo encerrado" : "Processo reaberto";
        setSuccess(label);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-dim" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif">Configuracoes</h2>
          <p className="text-dim text-sm mt-1">Edite as informacoes da avaliacao</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-sm text-sage bg-sage/10 border border-sage/20 px-3 py-1.5 rounded-lg">
            <CheckCircle size={14} />
            {success}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacoes Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea label="Descricao" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Textarea label="Instrucoes para candidatos" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          <Input label="Prazo de submissao" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-cream/80">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full px-3 bg-bg-elevated border border-white/10 rounded-lg text-sm text-cream focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
            >
              <option value="draft">Rascunho</option>
              <option value="open">Aberto (candidatos podem submeter)</option>
              <option value="evaluating">Em avaliacao</option>
              <option value="completed">Concluido</option>
            </select>
          </div>

          <Button onClick={handleSave} isLoading={saving} disabled={!name}>
            <Save size={16} />
            Salvar Alteracoes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formula de Avaliacao</CardTitle>
          <CardDescription>Pesos configurados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-bg-surface rounded-lg font-mono text-sm text-cream">
            Score Final = <span className="text-accent">(IA x 55%)</span> + <span className="text-sage">(Banca x 45%)</span>
          </div>
          <p className="text-[10px] text-dim mt-2">Para alterar os pesos das fases (Case/Pitch), edite o template via API.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Controle do Processo</CardTitle>
          <CardDescription>Encerre ou reabra o processo seletivo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {status !== "completed" ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleStatusChange("completed")}
              isLoading={saving}
            >
              <XCircle size={14} />
              Encerrar Processo
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStatusChange("evaluating")}
              isLoading={saving}
            >
              <RotateCcw size={14} />
              Reabrir Processo
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
