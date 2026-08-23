"use client";

import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { KnowledgeManager } from "@/components/KnowledgeManager";
import { AgentNav } from "@/components/AgentNav";
import { Button, EmptyState, PageHeader, PageShell } from "@/components/ui";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

export default function KnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api.getAgent(id).then(setAgent).catch((loadError) => setError(errorMessage(loadError)));
  }, [id]);

  const retry = () => {
    setAgent(null);
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
          href="/knowledge"
          className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          All agents
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Knowledge base unavailable"
          description={error}
          action={<Button onClick={retry}>Try again</Button>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Link
        href="/knowledge"
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        All agents
      </Link>
      <PageHeader
        eyebrow="Knowledge / Agent library"
        title={agent ? `${agent.name}.` : "Loading…"}
        description="Add only the material this agent may rely on. Sources are split, indexed and returned with every grounded search."
      />
      {agent && <AgentNav agentId={agent.id} />}
      {agent && <KnowledgeManager agentId={agent.id} />}
    </PageShell>
  );
}
