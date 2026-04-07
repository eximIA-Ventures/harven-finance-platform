import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export function formatScore(score: number, max: number = 10): string {
  return `${score.toFixed(1)}/${max}`;
}

export function getScoreColor(score: number, max: number = 10): string {
  const pct = score / max;
  if (pct >= 0.8) return "text-sage";
  if (pct >= 0.7) return "text-accent";
  if (pct >= 0.5) return "text-warning";
  return "text-danger";
}

export function getScoreBarColor(score: number, max: number = 10): string {
  const pct = score / max;
  if (pct >= 0.8) return "bg-sage";
  if (pct >= 0.7) return "bg-accent";
  if (pct >= 0.5) return "bg-warning";
  return "bg-danger";
}

export function getClassification(score: number): { label: string; color: string } {
  if (score >= 8.0) return { label: "Destaque", color: "text-sage" };
  if (score >= 7.0) return { label: "Aprovado", color: "text-accent" };
  if (score >= 5.0) return { label: "Borderline", color: "text-warning" };
  return { label: "Reprovado", color: "text-danger" };
}

export function getDivergenceFlag(delta: number): {
  level: "ok" | "warning" | "critical";
  label: string;
  color: string;
} {
  if (delta <= 1.5) return { level: "ok", label: "OK", color: "text-sage" };
  if (delta <= 2.5) return { level: "warning", label: "Revisar", color: "text-warning" };
  return { level: "critical", label: "Divergente", color: "text-danger" };
}
