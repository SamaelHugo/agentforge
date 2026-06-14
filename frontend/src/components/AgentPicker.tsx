"use client";

import { motion } from "framer-motion";
import { Boxes, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";
import { ToolPill } from "@/components/ToolPill";
import { EmptyState, LinkButton, Skeleton, StatusDot } from "@/components/ui";

export function AgentPicker({ basePath }: { basePath: string }) {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listAgents()
      .then(setAgents)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <EmptyState
        icon={Boxes}
        title="Couldn't reach the backend"
        description={error}
      />
    );
  }

  if (agents === null) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <EmptyState
        icon={Boxes}
        title="No agents yet"
        description="Create an agent first, then come back here."
        action={
          <LinkButton href="/agents/new" variant="primary">
            Create an agent
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href={`${basePath}/${agent.id}`}
            className="glass group flex h-full flex-col rounded-t-glass rounded-b-xl p-5 transition-all hover:bg-white/[0.09]"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <StatusDot status={agent.status} />
                <span className="micro-label">{agent.status}</span>
              </span>
              <ChevronRight
                size={16}
                className="text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-accent-cyan"
              />
            </div>
            <h3 className="font-display text-lg font-semibold tracking-tight text-ink group-hover:text-accent-cyan">
              {agent.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
              {agent.description || "No description."}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {agent.tools.map((t) => (
                <ToolPill key={t} name={t} />
              ))}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
