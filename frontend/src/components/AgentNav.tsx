"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Overview", path: (id: string) => `/agents/${id}` },
  { label: "Playground", path: (id: string) => `/playground/${id}` },
  { label: "Knowledge", path: (id: string) => `/knowledge/${id}` },
  { label: "Runs", path: (id: string) => `/runs/${id}` },
  { label: "Artifacts", path: (id: string) => `/artifacts/${id}` },
];

export function AgentNav({ agentId, className }: { agentId: string; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("mb-10 flex overflow-x-auto border-y border-line", className)} aria-label="Agent workspace">
      {ITEMS.map((item, index) => {
        const href = item.path(agentId);
        const active = pathname === href;
        return (
          <Link
            key={item.label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 border-r border-line px-4 py-3 text-xs transition-colors",
              active ? "bg-ink text-white" : "bg-transparent text-ink-muted hover:bg-white hover:text-ink",
            )}
          >
            <span className={cn("font-mono text-[8px]", active ? "text-white/60" : "text-ink-faint")}>
              {String(index + 1).padStart(2, "0")}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
