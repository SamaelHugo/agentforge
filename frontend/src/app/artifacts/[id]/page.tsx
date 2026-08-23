"use client";

import { AlertTriangle, ArrowLeft, Database, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  Badge,
  Button,
  EmptyState,
  LinkButton,
  PageHeader,
  PageShell,
  Skeleton,
} from "@/components/ui";
import { AgentNav } from "@/components/AgentNav";
import { api } from "@/lib/api";
import type { Agent, Artifact } from "@/lib/types";
import { errorMessage, timeAgo } from "@/lib/utils";

export default function ArtifactsPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    Promise.all([api.getAgent(id), api.listArtifacts(id)])
      .then(([agentResult, artifactResults]) => {
        setAgent(agentResult);
        setArtifacts(artifactResults);
      })
      .catch((loadError) => setError(errorMessage(loadError)));
  }, [id]);

  const retry = () => {
    setAgent(null);
    setArtifacts(null);
    setError(null);
    load();
  };

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <PageShell>
        <Link
          href="/artifacts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          All agents
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Artifacts unavailable"
          description={error}
          action={<Button onClick={retry}>Try again</Button>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        href="/artifacts"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        All agents
      </Link>
      <PageHeader
        eyebrow="Artifacts / Agent archive"
        title={agent ? `${agent.name}.` : "Loading…"}
        description="Persistent reports, records and structured output created by this agent's tools."
        actions={
          agent && (
            <LinkButton href={`/playground/${agent.id}`} variant="primary">
              New run
            </LinkButton>
          )
        }
      />

      {agent && <AgentNav agentId={agent.id} />}

      {artifacts === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      )}

      {artifacts?.length === 0 && (
        <EmptyState
          icon={Database}
          title="No saved artifacts"
          description="Run an agent with the Save to DB tool to create a persistent record."
          action={
            agent && (
              <LinkButton href={`/playground/${agent.id}`} variant="primary">
                Open Playground
              </LinkButton>
            )
          }
        />
      )}

      {artifacts && artifacts.length > 0 && (
        <div className="border-t border-line">
          {artifacts.map((artifact) => (
            <article key={artifact.id} className="grid gap-6 border-b border-line py-7 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Badge>{artifact.kind || "record"}</Badge>
                  <span className="text-xs text-ink-faint">{timeAgo(artifact.created_at)}</span>
                </div>
                <h2 className="font-editorial text-2xl font-medium leading-tight text-ink">
                  {artifact.title || "Untitled artifact"}
                </h2>
                {artifact.run_id && (
                  <Link
                    href={`/runs/${id}/${artifact.run_id}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs text-brand transition-colors hover:text-ink"
                  >
                    View source run
                    <ExternalLink size={13} />
                  </Link>
                )}
              </div>
              <p className="max-w-3xl whitespace-pre-wrap text-sm leading-[1.75] text-ink-muted">
                {artifact.content || "No text content."}
              </p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
