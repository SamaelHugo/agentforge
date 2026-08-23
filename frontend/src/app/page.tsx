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

  const totalRuns = agents?.reduce((sum, agent) => sum + agent.run_count, 0) ?? 0;
  const totalDocuments =
    agents?.reduce((sum, agent) => sum + agent.document_count, 0) ?? 0;
  const activeAgents = agents?.filter((agent) => agent.status === "active").length ?? 0;

  return (
    <PageShell>
      <PageHeader
        eyebrow="01 / Agent directory"
        title="Your agents."
        description="Create focused AI operators, connect them to trusted knowledge and tools, then inspect every decision they make."
        actions={
          <LinkButton href="/agents/new" variant="primary">
            <Plus size={15} />
            New agent
          </LinkButton>
        }
      />

      {agents && agents.length > 0 && (
        <section className="mb-14 grid grid-cols-2 border-y border-line lg:grid-cols-4">
          {[
            ["Agents", agents.length],
            ["Active", activeAgents],
            ["Runs", totalRuns],
            ["Documents", totalDocuments],
          ].map(([label, value], index) => (
            <div
              key={label}
              className={`py-5 ${index % 2 === 0 ? "pr-5" : "border-l border-line pl-5"} lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0`}
            >
              <p className="micro-label">{label}</p>
              <p className="mt-3 font-editorial text-4xl leading-none text-ink">{value}</p>
            </div>
          ))}
        </section>
      )}

      {error && (
        <EmptyState
          icon={Boxes}
          title="Couldn't reach the backend"
          description={`${error} — is the API running on the configured URL?`}
        />
      )}

      {!error && agents === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
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
        <section>
          <div className="hidden grid-cols-[40px_minmax(260px,1.25fr)_minmax(210px,.9fr)_150px_auto] gap-5 border-b border-line pb-3 lg:grid">
            <span />
            <span className="micro-label">Agent</span>
            <span className="micro-label">Capabilities</span>
            <span className="micro-label">Activity</span>
            <span className="micro-label">Status</span>
          </div>
          {agents.map((agent, index) => (
            <AgentCard key={agent.id} agent={agent} ordinal={index + 1} />
          ))}
        </section>
      )}
    </PageShell>
  );
}
