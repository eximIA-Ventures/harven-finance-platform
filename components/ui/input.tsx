import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-cream/80">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "h-10 w-full px-3 bg-bg-elevated border border-white/10 rounded-lg text-sm text-cream placeholder:text-dim transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
          error && "border-danger ring-2 ring-danger/30",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-cream/80">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          "w-full px-3 py-3 bg-bg-elevated border border-white/10 rounded-lg text-sm text-cream placeholder:text-dim transition-all duration-150 resize-y min-h-[88px]",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
          error && "border-danger ring-2 ring-danger/30",
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
);

Textarea.displayName = "Textarea";
