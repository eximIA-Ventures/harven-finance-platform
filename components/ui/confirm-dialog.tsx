"use client";
import { Button } from "./button";

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, variant = "danger" }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void;
  variant?: "danger" | "primary";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-bg-surface rounded-2xl ring-1 ring-[var(--border-color)] p-6 max-w-sm w-full shadow-elevated">
        <h3 className="text-base font-semibold text-cream mb-2">{title}</h3>
        <p className="text-sm text-dim mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>Confirmar</Button>
        </div>
      </div>
    </div>
  );
}
