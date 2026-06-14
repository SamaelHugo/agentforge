"use client";

import { motion } from "framer-motion";
import { Database, MessageSquare, Pencil, Play } from "lucide-react";
import Link from "next/link";

import type { Agent } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { ToolPill } from "@/components/ToolPill";
import { LinkButton, StatusDot } from "@/components/ui";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="glass group flex flex-col rounded-t-glass rounded-b-xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <StatusDot status={agent.status} />
          <span className="micro-label">{agent.status}</span>
        </span>
        <span className="font-mono text-[11px] text-ink-faint">{agent.model}</span>
      </div>

      <Link href={`/agents/${agent.id}`}>
        <h3 className="font-display text-xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent-cyan">
          {agent.name}
        </h3>
      </Link>
      <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-ink-muted">
        {agent.description || "No description."}
      </p>

      {agent.tools.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {agent.tools.map((t) => (
            <ToolPill key={t} name={t} />
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center gap-4 border-t border-white/8 pt-4 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <MessageSquare size={13} className="text-ink-faint" />
          {agent.run_count} {agent.run_count === 1 ? "run" : "runs"}
        </span>
        <span className="flex items-center gap-1.5">
          <Database size={13} className="text-ink-faint" />
          {agent.document_count} {agent.document_count === 1 ? "doc" : "docs"}
        </span>
        <span className="ml-auto">{timeAgo(agent.last_run_at)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <LinkButton
          href={`/playground/${agent.id}`}
          variant="primary"
          size="sm"
          className="flex-1"
        >
          <Play size={14} />
          Playground
        </LinkButton>
        <LinkButton href={`/agents/${agent.id}`} variant="glass" size="sm">
          <Pencil size={14} />
          Edit
        </LinkButton>
      </div>
    </motion.div>
  );
}
