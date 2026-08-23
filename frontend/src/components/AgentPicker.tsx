"use client";

import { ArrowUpRight, Boxes } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";
import { ToolPill } from "@/components/ToolPill";
import {
  Button,
  EmptyState,
  LinkButton,
  Skeleton,
  StatusDot,
} from "@/components/ui";
import { errorMessage } from "@/lib/utils";

export function AgentPicker({ basePath }: { basePath: string }) {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .listAgents()
      .then(setAgents)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const retry = () => {
    setAgents(null);
    setError(null);
    load();
  };

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <EmptyState
        icon={Boxes}
        title="Couldn't reach the backend"
        description={error}
        action={<Button onClick={retry}>Try again</Button>}
      />
    );
  }

  if (agents === null) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
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
    <div className="border-t border-line">
      {agents.map((agent, i) => (
        <Link
          key={agent.id}
          href={`${basePath}/${agent.id}`}
          className="group grid gap-4 border-b border-line py-6 transition-colors hover:bg-white/60 sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:items-center"
        >
          <span className="font-mono text-[10px] text-ink-faint">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusDot status={agent.status} />
              <h3 className="font-display text-lg font-semibold tracking-[-0.03em] text-ink group-hover:text-brand">
              {agent.name}
              </h3>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-ink-muted">
              {agent.description || "No description."}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 sm:hidden">
              {agent.tools.map((t) => (
                <ToolPill key={t} name={t} />
              ))}
            </div>
          </div>
          <div className="hidden items-center gap-5 sm:flex">
            <div className="flex max-w-[360px] flex-wrap justify-end gap-1.5">
              {agent.tools.slice(0, 3).map((tool) => <ToolPill key={tool} name={tool} />)}
            </div>
            <ArrowUpRight size={17} className="text-ink-faint transition-colors group-hover:text-brand" />
          </div>
        </Link>
      ))}
    </div>
  );
}
