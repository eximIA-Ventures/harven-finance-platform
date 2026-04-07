"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Evaluator {
  id: string;
  name: string;
  email: string;
  role: string | null;
  accessToken: string;
}

export default function EvaluatorsPage() {
  const { id } = useParams<{ id: string }>();
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/evaluations/${id}/data`)
      .then((r) => r.json())
      .then((data) => setEvaluators(data.evaluators || []))
      .catch(() => {});
  }, [id]);

  async function handleAdd() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/evaluations/${id}/evaluators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role: role || undefined }),
      });
      const data = await res.json();
      setEvaluators([...evaluators, { id: data.id, name, email, role, accessToken: data.token }]);
      setName("");
      setEmail("");
      setRole("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Avaliadores (Banca)</h2>
        <p className="text-text-secondary mt-1">
          Adicione membros da banca avaliadora. Cada um receberá um link único.
        </p>
      </div>

      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Avaliador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nome"
              placeholder="Prof. Luciano"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="luciano@harven.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Input
            label="Cargo/Função (opcional)"
            placeholder="Coordenador da Liga"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Button onClick={handleAdd} isLoading={isLoading} disabled={!name || !email}>
            + Adicionar
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {evaluators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{evaluators.length} Avaliador(es)</CardTitle>
            <CardDescription>
              Compartilhe o link de acesso com cada avaliador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {evaluators.map((ev) => (
              <div
                key={ev.id}
                className="p-4 bg-bg-elevated rounded-lg space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{ev.name}</span>
                    {ev.role && (
                      <span className="text-text-muted ml-2 text-sm">
                        ({ev.role})
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-text-muted">{ev.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-bg p-2 rounded border border-border font-mono truncate">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/eval/${ev.accessToken}`
                      : `/eval/${ev.accessToken}`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/eval/${ev.accessToken}`
                      )
                    }
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
