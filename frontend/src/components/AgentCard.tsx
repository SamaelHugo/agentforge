import { ArrowUpRight, Database, MessageSquare, Play } from "lucide-react";
import Link from "next/link";

import type { Agent } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { ToolPill } from "@/components/ToolPill";
import { StatusDot } from "@/components/ui";

export function AgentCard({ agent, ordinal }: { agent: Agent; ordinal: number }) {
  return (
    <article className="group border-b border-line transition-colors hover:bg-white/60">
      <div className="grid gap-5 py-6 sm:grid-cols-[40px_minmax(0,1fr)_auto] lg:grid-cols-[40px_minmax(260px,1.25fr)_minmax(210px,.9fr)_150px_auto] lg:items-center">
        <span className="font-mono text-[10px] text-ink-faint">
          {String(ordinal).padStart(2, "0")}
        </span>

        <div className="min-w-0">
          <Link href={`/agents/${agent.id}`} className="inline-flex items-center gap-2">
            <h3 className="font-display text-xl font-semibold tracking-[-0.035em] text-ink transition-colors group-hover:text-brand">
              {agent.name}
            </h3>
            <ArrowUpRight size={15} className="text-ink-faint transition-colors group-hover:text-brand" />
          </Link>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-ink-muted">
            {agent.description || "No description."}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:col-start-2 lg:col-start-auto">
          {agent.tools.length > 0 ? (
            agent.tools.map((tool) => <ToolPill key={tool} name={tool} />)
          ) : (
            <span className="text-xs text-ink-faint">No tools</span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-ink-muted sm:col-start-2 lg:col-start-auto lg:block lg:space-y-1.5">
          <span className="flex items-center gap-1.5">
            <MessageSquare size={13} className="text-ink-faint" />
            {agent.run_count} {agent.run_count === 1 ? "run" : "runs"}
          </span>
          <span className="flex items-center gap-1.5">
            <Database size={13} className="text-ink-faint" />
            {agent.document_count} {agent.document_count === 1 ? "doc" : "docs"}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
            {timeAgo(agent.last_run_at)}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:col-start-3 sm:row-start-1 sm:justify-self-end lg:col-start-auto lg:row-start-auto">
          <span className="hidden items-center gap-2 xl:flex">
            <StatusDot status={agent.status} />
            <span className="micro-label">{agent.status}</span>
          </span>
          <Link
            href={`/playground/${agent.id}`}
            className="inline-flex h-9 items-center gap-2 border border-ink bg-ink px-3 text-xs font-medium text-white transition-colors hover:border-brand hover:bg-brand"
          >
            <Play size={13} />
            Run
          </Link>
        </div>
      </div>
    </article>
  );
}
