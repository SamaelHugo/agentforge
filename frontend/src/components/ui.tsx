import { Loader2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

// ── Layout ───────────────────────────────────────────────────────────────
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-8 py-10", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        {eyebrow && <p className="micro-label mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────
type Variant = "primary" | "glass" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent-cyan/15 text-accent-cyan ring-1 ring-inset ring-accent-cyan/40 hover:bg-accent-cyan/25",
  glass: "glass text-ink hover:bg-white/[0.09]",
  ghost: "text-ink-muted hover:bg-white/[0.05] hover:text-ink",
  danger:
    "bg-accent-red/10 text-accent-red ring-1 ring-inset ring-accent-red/30 hover:bg-accent-red/20",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "glass",
  size = "md",
  loading,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "glass",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

// ── Form fields ─────────────────────────────────────────────────────────
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="micro-label mb-2 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "glass-input w-full rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

// ── Misc ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  active: "bg-accent-green",
  running: "bg-accent-cyan",
  completed: "bg-accent-green",
  error: "bg-accent-red",
  idle: "bg-ink-faint",
};

export function StatusDot({ status }: { status: string }) {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-60",
          STATUS_COLOR[status] ?? "bg-ink-faint",
          (status === "running" || status === "active") && "animate-ping",
        )}
      />
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          STATUS_COLOR[status] ?? "bg-ink-faint",
        )}
      />
    </span>
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-xl", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin text-ink-muted", className)} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass-soft flex flex-col items-center justify-center rounded-glass px-8 py-16 text-center">
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-white/[0.05] text-ink-muted">
        <Icon size={22} />
      </span>
      <h3 className="font-display text-lg font-medium text-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
