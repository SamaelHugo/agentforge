"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { KnowledgeManager } from "@/components/KnowledgeManager";
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
        eyebrow="Knowledge Base"
        title={agent ? agent.name : "Loading…"}
        description="Documents available to this agent's semantic search tool."
      />
      {id && <KnowledgeManager agentId={id} />}
    </PageShell>
  );
}
