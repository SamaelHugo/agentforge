"use client";

import { Boxes, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { AgentCard } from "@/components/AgentCard";
import {
  EmptyState,
  LinkButton,
  PageHeader,
  PageShell,
  Skeleton,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listAgents()
      .then(setAgents)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Your workspace"
        title="Agents"
        description="Autonomous AI agents with their own tools and knowledge. Build one, then watch it think in the Playground."
        actions={
          <LinkButton href="/agents/new" variant="primary">
            <Plus size={15} />
            New agent
          </LinkButton>
        }
      />

      {error && (
        <EmptyState
          icon={Boxes}
          title="Couldn't reach the backend"
          description={`${error} — is the API running on the configured URL?`}
        />
      )}

      {!error && agents === null && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      )}

      {!error && agents?.length === 0 && (
        <EmptyState
          icon={Boxes}
          title="No agents yet"
          description="Create your first agent — give it a system prompt, tools, and a knowledge base."
          action={
            <LinkButton href="/agents/new" variant="primary">
              <Plus size={15} />
              Create an agent
            </LinkButton>
          }
        />
      )}

      {agents && agents.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
