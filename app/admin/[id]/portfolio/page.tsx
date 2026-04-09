"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Briefcase,
  DollarSign,
  BarChart3,
  Target,
  Plus,
  X,
  Pencil,
  Trash2,
  Check,
  Calendar,
  FileText,
  User,
} from "lucide-react";

interface Position {
  id: string;
  ticker: string;
  companyName: string;
  positionType: string;
  entryDate: string;
  entryPrice: number;
  quantity: number;
  currentPrice: number | null;
  exitDate: string | null;
  exitPrice: number | null;
  thesis: string | null;
  thesisAuthor: string | null;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" }> = {
  open: { label: "Aberta", variant: "success" },
  closed: { label: "Encerrada", variant: "default" },
  stopped: { label: "Stopada", variant: "danger" },
};

const typeConfig: Record<string, { label: string; variant: "success" | "danger" }> = {
  long: { label: "Long", variant: "success" },
  short: { label: "Short", variant: "danger" },
};

/* ── Shared input class ── */
const inputCls =
  "w-full px-3 py-2 bg-bg-elevated border border-[var(--border-color)] rounded-xl text-sm text-cream placeholder:text-dim/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/40 transition-all";

/* ── New Position Modal ── */
function NewPositionModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [positionType, setPositionType] = useState<"long" | "short">("long");
  const [entryDate, setEntryDate] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [thesis, setThesis] = useState("");
  const [thesisAuthor, setThesisAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTicker("");
    setCompanyName("");
    setPositionType("long");
    setEntryDate("");
    setEntryPrice("");
    setQuantity("");
    setThesis("");
    setThesisAuthor("");
  };

  const handleSubmit = async () => {
    if (!ticker || !companyName || !entryDate || !entryPrice) return;
    setSubmitting(true);

    const body = {
      ticker: ticker.toUpperCase(),
      company_name: companyName,
      position_type: positionType,
      entry_date: entryDate,
      entry_price: parseFloat(entryPrice),
      quantity: parseFloat(quantity) || 0,
      thesis: thesis || null,
      thesis_author: thesisAuthor || null,
    };

    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        reset();
        onClose();
        onCreated();
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ESC to close */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const liveTitle =
    ticker || companyName
      ? `${ticker.toUpperCase() || "---"}${companyName ? ` - ${companyName}` : ""}`
      : "Nova Posicao";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "modal-fade 0.2s ease-out" }}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ animation: "modal-scale 0.25s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="bg-bg-card rounded-2xl shadow-elevated border border-[var(--border-color)]">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-bg-card rounded-t-2xl border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  positionType === "long" ? "bg-sage" : "bg-danger"
                }`}
              />
              <h2 className="text-lg font-semibold text-cream truncate max-w-[300px]">
                {liveTitle}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-dim hover:text-cream hover:bg-bg-elevated transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* Big ticker input */}
            <input
              autoFocus
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="TICKER"
              className="w-full text-2xl font-mono font-bold text-cream bg-transparent border-none outline-none placeholder:text-dim/40 tracking-wider"
            />

            {/* Company name */}
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nome da empresa"
              className="w-full text-base text-cream bg-transparent border-none outline-none placeholder:text-dim/40"
            />

            {/* Position type pills */}
            <div className="flex gap-2">
              {(["long", "short"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPositionType(t)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                    positionType === t
                      ? t === "long"
                        ? "bg-sage text-white"
                        : "bg-danger text-white"
                      : "bg-bg-elevated text-dim hover:text-cream border border-[var(--border-color)]"
                  }`}
                >
                  {t === "long" ? "Long" : "Short"}
                </button>
              ))}
            </div>

            {/* Entry date */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-accent flex-shrink-0" />
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                  Data de Entrada
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {/* Entry price + Quantity side by side */}
            <div className="flex items-start gap-3">
              <DollarSign className="w-4 h-4 text-accent flex-shrink-0 mt-6" />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                    Preco de Entrada (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="18.50"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="100"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>

            {/* Thesis */}
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-accent flex-shrink-0 mt-6" />
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                  Tese de Investimento
                </label>
                <textarea
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                  placeholder="Descreva a tese..."
                  rows={3}
                  className={`${inputCls} resize-y min-h-[80px]`}
                />
              </div>
            </div>

            {/* Thesis author */}
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-accent flex-shrink-0" />
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-dim block mb-1">
                  Autor da Tese
                </label>
                <input
                  value={thesisAuthor}
                  onChange={(e) => setThesisAuthor(e.target.value)}
                  placeholder="Nome do analista"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 bg-bg-card rounded-b-2xl border-t border-[var(--border-color)] px-6 py-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-sm text-dim hover:text-cream transition-colors"
            >
              Cancelar
            </button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !ticker || !companyName || !entryDate || !entryPrice}
            >
              {submitting ? "Criando..." : "Criar Posicao"}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
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

/* ── Main Page ── */
export default function PortfolioPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const data = await res.json();
        setPositions(data);
      }
    } catch (err) {
      console.error("Failed to fetch positions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const handleUpdatePrice = async (id: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price)) return;

    const res = await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_price: price }),
    });

    if (res.ok) {
      setEditingId(null);
      setEditPrice("");
      fetchPositions();
    }
  };

  const handleClosePosition = async (id: string, currentPrice: number | null) => {
    const now = new Date().toISOString().split("T")[0];
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "closed",
        exit_date: now,
        exit_price: currentPrice,
      }),
    });

    if (res.ok) fetchPositions();
  };

  const handleStopPosition = async (id: string, currentPrice: number | null) => {
    const now = new Date().toISOString().split("T")[0];
    const res = await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "stopped",
        exit_date: now,
        exit_price: currentPrice,
      }),
    });

    if (res.ok) fetchPositions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta posicao?")) return;

    const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    if (res.ok) fetchPositions();
  };

  const openPositions = positions.filter((p) => p.status === "open");
  const totalInvested = positions.reduce(
    (sum, p) => sum + p.entryPrice * (p.quantity || 100),
    0
  );
  const totalCurrent = positions.reduce(
    (sum, p) => sum + (p.currentPrice || p.entryPrice) * (p.quantity || 100),
    0
  );
  const totalReturn = totalCurrent - totalInvested;
  const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  const getReturnPct = (pos: Position) => {
    const current = pos.exitPrice || pos.currentPrice || pos.entryPrice;
    if (pos.positionType === "short") {
      return ((pos.entryPrice - current) / pos.entryPrice) * 100;
    }
    return ((current - pos.entryPrice) / pos.entryPrice) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-dim text-sm">Carregando portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-cream">Carteira da Liga</h2>
          <p className="text-dim text-sm mt-1">
            {positions.length} posicoes registradas · {openPositions.length} abertas
          </p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Nova Posicao
        </Button>
      </div>

      {/* New Position Modal */}
      <NewPositionModal
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={fetchPositions}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-dim font-semibold">
                Total Investido
              </p>
              <p className="text-lg font-bold font-mono text-cream mt-0.5">
                R$ {totalInvested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${returnPct >= 0 ? "bg-sage/10" : "bg-danger/10"}`}>
              {returnPct >= 0 ? (
                <TrendingUp className="w-4 h-4 text-sage" />
              ) : (
                <TrendingDown className="w-4 h-4 text-danger" />
              )}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-dim font-semibold">
                Retorno Total
              </p>
              <p
                className={`text-lg font-bold font-mono mt-0.5 ${
                  returnPct >= 0 ? "text-sage" : "text-danger"
                }`}
              >
                {returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <BarChart3 className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-dim font-semibold">
                P&L Total
              </p>
              <p
                className={`text-lg font-bold font-mono mt-0.5 ${
                  totalReturn >= 0 ? "text-sage" : "text-danger"
                }`}
              >
                {totalReturn >= 0 ? "+" : ""}R$ {totalReturn.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-sage/10">
              <Target className="w-4 h-4 text-sage" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.12em] text-dim font-semibold">
                Posicoes Abertas
              </p>
              <p className="text-lg font-bold font-mono text-cream mt-0.5">
                {openPositions.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-accent" />
            Posicoes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Ticker
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Entrada
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Preco Entrada
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Preco Atual
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Retorno
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Tese
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => {
                  const st = statusConfig[pos.status] || statusConfig.open;
                  const tp = typeConfig[pos.positionType] || typeConfig.long;
                  const retPct = getReturnPct(pos);

                  return (
                    <tr
                      key={pos.id}
                      className="border-b border-[var(--border-color)] hover:bg-bg-surface transition-colors"
                    >
                      <td className="px-4 py-4 font-mono font-bold text-cream">
                        {pos.ticker}
                      </td>
                      <td className="px-4 py-4 text-cream">{pos.companyName}</td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={tp.variant}>{tp.label}</Badge>
                      </td>
                      <td className="px-4 py-4 text-dim font-mono text-xs">
                        {new Date(pos.entryDate).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-cream">
                        R$ {pos.entryPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-cream">
                        {editingId === pos.id ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-20 h-7 px-2 bg-bg-elevated border border-[var(--border-color)] rounded text-xs text-cream text-right focus:outline-none focus:ring-2 focus:ring-accent/30"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleUpdatePrice(pos.id);
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setEditPrice("");
                                }
                              }}
                            />
                            <button
                              onClick={() => handleUpdatePrice(pos.id)}
                              className="p-1 hover:bg-bg-elevated rounded"
                            >
                              <Check className="w-3 h-3 text-sage" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className="cursor-pointer hover:text-accent transition-colors"
                            onClick={() => {
                              if (pos.status === "open") {
                                setEditingId(pos.id);
                                setEditPrice(String(pos.currentPrice || pos.entryPrice));
                              }
                            }}
                          >
                            R$ {(pos.currentPrice || pos.entryPrice).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span
                          className={`font-mono font-bold ${
                            retPct >= 0 ? "text-sage" : "text-danger"
                          }`}
                        >
                          {retPct >= 0 ? "+" : ""}
                          {retPct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-dim text-xs max-w-[200px] truncate">
                        {pos.thesis}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {pos.status === "open" && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(pos.id);
                                  setEditPrice(String(pos.currentPrice || pos.entryPrice));
                                }}
                                className="p-1.5 hover:bg-bg-elevated rounded transition-colors"
                                title="Editar preco"
                              >
                                <Pencil className="w-3.5 h-3.5 text-dim hover:text-cream" />
                              </button>
                              <button
                                onClick={() => handleClosePosition(pos.id, pos.currentPrice)}
                                className="p-1.5 hover:bg-sage/10 rounded transition-colors"
                                title="Encerrar posicao"
                              >
                                <Check className="w-3.5 h-3.5 text-dim hover:text-sage" />
                              </button>
                              <button
                                onClick={() => handleStopPosition(pos.id, pos.currentPrice)}
                                className="p-1.5 hover:bg-danger/10 rounded transition-colors"
                                title="Stop loss"
                              >
                                <X className="w-3.5 h-3.5 text-dim hover:text-danger" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(pos.id)}
                            className="p-1.5 hover:bg-danger/10 rounded transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-dim hover:text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {positions.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-dim text-sm">
                      Nenhuma posicao registrada. Clique em &quot;Nova Posicao&quot; para comecar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
