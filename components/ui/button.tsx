import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-accent text-[#0A0A0A] font-medium hover:brightness-110 transition-all",
  secondary:
    "bg-bg-surface border border-[var(--border-color)] text-cream hover:border-accent/30 transition-colors",
  ghost:
    "text-dim hover:text-cream hover:bg-bg-elevated transition-colors",
  danger:
    "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-colors",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3.5 text-sm gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-8 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
);

Button.displayName = "Button";
