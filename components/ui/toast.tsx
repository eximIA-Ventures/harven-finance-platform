"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

type ToastType = "success" | "error" | "info";
interface Toast { id: string; message: string; type: ToastType; }

const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType) => void;
}>({ addToast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, type: ToastType = "success") {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container - fixed bottom right */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-elevated animate-fade-in-up text-sm ${
            t.type === "success" ? "bg-sage/20 text-sage ring-1 ring-sage/30" :
            t.type === "error" ? "bg-danger/20 text-danger ring-1 ring-danger/30" :
            "bg-accent/20 text-accent ring-1 ring-accent/30"
          }`}>
            {t.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{t.message}</span>
            <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
