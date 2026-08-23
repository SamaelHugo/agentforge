"use client";

import { ArrowLeft, Database, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Badge,
  EmptyState,
  LinkButton,
  PageHeader,
  PageShell,
  Skeleton,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { Agent, Artifact } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export default function ArtifactsPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[] | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getAgent(id), api.listArtifacts(id)])
      .then(([agentResult, artifactResults]) => {
        setAgent(agentResult);
        setArtifacts(artifactResults);
      })
      .catch(() => setArtifacts([]));
  }, [id]);

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
        eyebrow="Artifacts"
        title={agent ? agent.name : "Loading…"}
        description="Persistent output created by this agent's tools."
        actions={
          agent && (
            <LinkButton href={`/playground/${agent.id}`} variant="primary">
              New run
            </LinkButton>
          )
        }
      />

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
        <div className="space-y-4">
          {artifacts.map((artifact) => (
            <article key={artifact.id} className="surface rounded-card p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge>{artifact.kind || "record"}</Badge>
                    <span className="text-xs text-ink-faint">
                      {timeAgo(artifact.created_at)}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {artifact.title || "Untitled artifact"}
                  </h2>
                </div>
                {artifact.run_id && (
                  <Link
                    href={`/runs/${id}/${artifact.run_id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-accent-cyan transition-colors hover:text-ink"
                  >
                    View source run
                    <ExternalLink size={13} />
                  </Link>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                {artifact.content || "No text content."}
              </p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
