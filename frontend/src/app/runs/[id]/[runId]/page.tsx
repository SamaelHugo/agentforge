"use client";

import { AlertTriangle, ArrowLeft, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { TraceStep } from "@/components/trace/TraceStep";
import {
  Button,
  EmptyState,
  PageHeader,
  PageShell,
  Skeleton,
  StatusDot,
} from "@/components/ui";
import { api } from "@/lib/api";
import type { RunDetail, TraceEvent } from "@/lib/types";
import { errorMessage, parseDate } from "@/lib/utils";

export default function RunReplayPage() {
  const { id, runId } = useParams<{ id: string; runId: string }>();
  const [run, setRun] = useState<RunDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!runId) return;
    api.getRun(runId).then(setRun).catch((loadError) => setError(errorMessage(loadError)));
  }, [runId]);

  const retry = () => {
    setRun(null);
    setError(null);
    load();
  };

  useEffect(() => {
    load();
  }, [load]);

  const steps: TraceEvent[] =
    run?.steps
      .filter((s) => s.type !== "final")
      .map((s) => ({ type: s.type, content: s.content })) ?? [];

  return (
    <PageShell>
      <Link
        href={`/runs/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Run history
      </Link>

      {error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Run unavailable"
          description={error}
          action={<Button onClick={retry}>Try again</Button>}
        />
      ) : !run ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <PageHeader
            eyebrow="Run / Replay"
            title="Execution record."
            description={
              <span className="flex items-center gap-2">
                <StatusDot status={run.status} />
                {run.status} · started{" "}
                {parseDate(run.started_at)?.toLocaleString() ?? "—"}
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* conversation */}
            <div className="space-y-8 lg:col-span-7">
              <div className="grid gap-3 border-t border-line py-5 sm:grid-cols-[80px_minmax(0,1fr)]">
                <p className="micro-label pt-1">Input</p>
                <div className="max-w-2xl text-[15px] font-medium leading-relaxed text-ink">
                  {run.input}
                </div>
              </div>
              {run.status === "error" ? (
                <div className="grid gap-3 border-t border-line py-5 sm:grid-cols-[80px_minmax(0,1fr)]">
                  <p className="micro-label pt-1 text-accent-red">Error</p>
                  <p className="text-sm text-accent-red">{run.error || "Run failed."}</p>
                </div>
              ) : (
                <div className="grid gap-3 border-t border-line py-5 sm:grid-cols-[80px_minmax(0,1fr)]">
                  <p className="micro-label pt-1 text-brand">Output</p>
                  <div className="max-w-2xl whitespace-pre-wrap text-[15px] leading-[1.75] text-ink">{run.output || "—"}</div>
                </div>
              )}
            </div>

            {/* trace */}
            <div className="border-y border-line bg-white p-5 lg:col-span-5">
              <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
                <BrainCircuit size={16} className="text-brand" />
                <h2 className="font-display text-base font-semibold text-ink">
                  Reasoning steps
                </h2>
              </div>
              {steps.length === 0 ? (
                <p className="text-sm text-ink-muted">No steps recorded.</p>
              ) : (
                steps.map((event, i) => (
                  <TraceStep key={i} event={event} last={i === steps.length - 1} />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
