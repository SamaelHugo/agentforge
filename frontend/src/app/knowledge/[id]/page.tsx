"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { KnowledgeManager } from "@/components/KnowledgeManager";
import { AgentNav } from "@/components/AgentNav";
import { PageHeader, PageShell } from "@/components/ui";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";

export default function KnowledgePage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (id) api.getAgent(id).then(setAgent).catch(() => setAgent(null));
  }, [id]);

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
      {id && <KnowledgeManager agentId={id} />}
    </PageShell>
  );
}
