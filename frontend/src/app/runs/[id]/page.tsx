"use client";

import { ArrowLeft, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState, LinkButton, PageHeader, PageShell, Skeleton, StatusDot } from "@/components/ui";
import { AgentNav } from "@/components/AgentNav";
import { api } from "@/lib/api";
import type { Agent, Run } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function RunHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [runs, setRuns] = useState<Run[] | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getAgent(id).then(setAgent).catch(() => setAgent(null));
    api.listRuns(id).then(setRuns).catch(() => setRuns([]));
  }, [id]);

  return (
    <PageShell>
      <Link
        href="/runs"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        All agents
      </Link>
      <PageHeader
        eyebrow="Runs / Agent history"
        title={agent ? `${agent.name}.` : "Loading…"}
        description="Every completed task, failure and tool event remains available for review."
        actions={
          agent && (
            <LinkButton href={`/playground/${agent.id}`} variant="primary">
              New run
            </LinkButton>
          )
        }
      />

      {agent && <AgentNav agentId={agent.id} />}

      {runs === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      )}

      {runs?.length === 0 && (
        <EmptyState
          icon={History}
          title="No runs yet"
          description="Head to the Playground and give this agent a task."
          action={
            agent && (
              <LinkButton href={`/playground/${agent.id}`} variant="primary">
                Open Playground
              </LinkButton>
            )
          }
        />
      )}

      {runs && runs.length > 0 && (
        <div className="border-t border-line">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/runs/${id}/${run.id}`}
              className="group grid gap-4 border-b border-line py-5 transition-colors hover:bg-white/60 sm:grid-cols-[16px_minmax(0,1fr)_100px_20px] sm:items-center"
            >
              <StatusDot status={run.status} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{run.input}</p>
                <p className="truncate text-xs text-ink-muted">
                  {run.output || run.error || "—"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-ink-faint">
                {timeAgo(run.started_at)}
              </span>
              <ChevronRight
                size={16}
                className="shrink-0 text-ink-faint transition-colors group-hover:text-brand"
              />
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
