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
    <div className={cn("mx-auto w-full max-w-[1440px] px-5 py-8 sm:px-8 md:px-10 md:py-12 xl:px-14", className)}>
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
    <header className="mb-12 grid gap-8 border-b border-line pb-8 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        {eyebrow && <p className="micro-label mb-5">{eyebrow}</p>}
        <h1 className="font-editorial text-5xl font-medium leading-[0.92] tracking-[-0.035em] text-ink sm:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 lg:col-span-4 lg:justify-end">{actions}</div>}
    </header>
  );
}

// ── Button ────────────────────────────────────────────────────────────────
type Variant = "primary" | "surface" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "border border-ink bg-ink text-white hover:bg-brand hover:border-brand",
  surface: "border border-line bg-white text-ink hover:border-ink",
  ghost: "text-ink-muted hover:bg-surface-raised hover:text-ink",
  danger: "border border-accent-red/25 bg-accent-red/15 text-accent-red hover:bg-accent-red/25",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "surface",
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
        "inline-flex items-center justify-center gap-2 rounded-[2px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
  variant = "surface",
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
        "inline-flex items-center justify-center gap-2 rounded-[2px] font-medium transition-colors",
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
        "field w-full rounded-[2px] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint",
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
        "field w-full rounded-[2px] px-3.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint",
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
        "field w-full rounded-[2px] px-3.5 py-2.5 text-sm text-ink",
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
          status === "running" && "animate-ping",
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
        "inline-flex items-center gap-1.5 rounded-[2px] border border-line bg-surface px-2 py-1 text-[11px] uppercase tracking-[0.08em] text-ink-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[2px]", className)} />;
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
    <div className="flex min-h-72 flex-col items-start justify-end border-y border-line px-1 py-10 text-left sm:px-0 sm:py-14">
      <span className="mb-8 grid h-10 w-10 place-items-center border border-line bg-white text-brand">
        <Icon size={22} />
      </span>
      <h3 className="font-editorial text-3xl font-medium text-ink">{title}</h3>
      {description && (
        <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
