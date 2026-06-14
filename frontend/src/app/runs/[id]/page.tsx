"use client";

import { ArrowLeft, ChevronRight, History } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState, LinkButton, PageHeader, PageShell, Skeleton, StatusDot } from "@/components/ui";
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
        eyebrow="Runs"
        title={agent ? agent.name : "Loading…"}
        description="Every run is recorded with its full reasoning trace."
        actions={
          agent && (
            <LinkButton href={`/playground/${agent.id}`} variant="primary">
              New run
            </LinkButton>
          )
        }
      />

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
        <div className="space-y-3">
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/runs/${id}/${run.id}`}
              className="glass group flex items-center gap-4 rounded-xl px-5 py-4 transition-all hover:bg-white/[0.09]"
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
                className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-1 group-hover:text-accent-cyan"
              />
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
