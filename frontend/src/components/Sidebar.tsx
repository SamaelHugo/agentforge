"use client";

import {
  Boxes,
  FileText,
  History,
  type LucideIcon,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Agents",
    icon: Boxes,
    match: (p) => p === "/" || p.startsWith("/agents"),
  },
  {
    href: "/playground",
    label: "Playground",
    icon: SquareTerminal,
    match: (p) => p.startsWith("/playground"),
  },
  {
    href: "/knowledge",
    label: "Knowledge Base",
    icon: FileText,
    match: (p) => p.startsWith("/knowledge"),
  },
  {
    href: "/runs",
    label: "Runs",
    icon: History,
    match: (p) => p.startsWith("/runs"),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setProvider(d.llm_provider))
      .catch(() => setProvider("offline"));
  }, []);

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-2 border-r border-line bg-surface p-5">
      <Link href="/" className="mb-6 flex items-center gap-3 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/25">
          <Sparkles size={18} />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">
          AgentForge
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "surface text-ink"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink",
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "transition-colors",
                  active ? "text-accent-cyan" : "text-ink-faint group-hover:text-ink-muted",
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2">
        <div className="flex items-center gap-2 rounded-xl border border-line-soft bg-surface px-3 py-2.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              provider === "anthropic"
                ? "bg-accent-green animate-pulse-soft"
                : provider === "offline"
                  ? "bg-accent-red"
                  : "bg-accent-amber animate-pulse-soft",
            )}
          />
          <div className="leading-tight">
            <p className="micro-label">Engine</p>
            <p className="text-xs text-ink-muted">
              {provider === null
                ? "connecting…"
                : provider === "anthropic"
                  ? "Claude (live)"
                  : provider === "offline"
                    ? "backend offline"
                    : "mock (offline)"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
