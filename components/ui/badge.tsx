import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "accent";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-bg-elevated text-cream-dim border-[var(--border-color)]",
  success: "bg-success/15 text-success border-success/25",
  warning: "bg-warning/15 text-warning border-warning/25",
  danger: "bg-danger/15 text-danger border-danger/25",
  info: "bg-sage/15 text-sage border-sage/25",
  accent: "bg-accent/15 text-accent border-accent/25",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
