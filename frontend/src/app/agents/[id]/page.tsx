"use client";

import { Boxes } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AgentBuilder } from "@/components/AgentBuilder";
import { Button, EmptyState, PageShell, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import type { Agent } from "@/lib/types";
import { errorMessage } from "@/lib/utils";

export default function EditAgentPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .getAgent(id)
      .then(setAgent)
      .catch((e) => setError(errorMessage(e)));
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
        <EmptyState
          icon={Boxes}
          title="Agent not found"
          description={error}
          action={<Button onClick={retry}>Try again</Button>}
        />
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
