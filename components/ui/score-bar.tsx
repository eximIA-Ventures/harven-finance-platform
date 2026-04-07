import { cn } from "@/lib/utils";

interface ScoreBarProps {
  score: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

function getBarColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return "bg-sage";
  if (pct >= 0.7) return "bg-accent";
  if (pct >= 0.5) return "bg-warning";
  return "bg-danger";
}

function getTextColor(score: number, max: number): string {
  const pct = score / max;
  if (pct >= 0.8) return "text-sage";
  if (pct >= 0.7) return "text-accent";
  if (pct >= 0.5) return "text-warning";
  return "text-danger";
}

export function ScoreBar({ score, max = 10, showLabel = true, size = "md" }: ScoreBarProps) {
  const pct = Math.min((score / max) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <div className={cn("flex-1 rounded-full bg-bg-elevated overflow-hidden", size === "sm" ? "h-1.5" : "h-2")}>
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", getBarColor(score, max))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-sm font-mono tabular-nums min-w-[3rem] text-right font-medium", getTextColor(score, max))}>
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}
