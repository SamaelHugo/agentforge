"use client";

import { Boxes } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AgentBuilder } from "@/components/AgentBuilder";
import { EmptyState, PageShell, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getAgent(id)
      .then(setAgent)
      .catch((e) => setError(String(e)));
  }, [id]);

  if (error) {
    return (
      <PageShell>
        <EmptyState icon={Boxes} title="Agent not found" description={error} />
      </PageShell>
    );
  }

  if (!agent) {
    return (
      <PageShell className="max-w-3xl">
        <Skeleton className="mb-8 h-12 w-1/2" />
        <div className="space-y-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </PageShell>
    );
  }

  return <AgentBuilder agent={agent} />;
}
