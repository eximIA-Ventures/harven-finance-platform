"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PSNav } from "@/components/ps-nav";

const statusVariant: Record<string, "default" | "accent" | "warning" | "success"> = {
  draft: "default",
  open: "accent",
  evaluating: "warning",
  completed: "success",
};
const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  evaluating: "Avaliando",
  completed: "Concluido",
};

export function PSHeader({ evaluationId }: { evaluationId: string }) {
  const [eval_, setEval] = useState<{ name: string; status: string; description: string | null } | null>(null);

  useEffect(() => {
    fetch(`/api/evaluations/${evaluationId}/data`)
      .then((r) => r.json())
      .then((d) => setEval(d))
      .catch(() => {});
  }, [evaluationId]);

  return (
    <div className="space-y-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-cream">
            {eval_?.name || "Carregando..."}
          </h1>
          {eval_ && (
            <Badge variant={statusVariant[eval_.status] || "default"}>
              {statusLabel[eval_.status] || eval_.status}
            </Badge>
          )}
        </div>
        {eval_?.description && (
          <p className="text-dim text-sm mt-1">{eval_.description}</p>
        )}
      </div>
      <PSNav evaluationId={evaluationId} />
    </div>
  );
}
