"use client";

import { ArrowLeft, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { TraceStep } from "@/components/trace/TraceStep";
import { PageHeader, PageShell, Skeleton, StatusDot } from "@/components/ui";
import { api } from "@/lib/api";
import type { RunDetail, TraceEvent } from "@/lib/types";
import { parseDate } from "@/lib/utils";

export default function RunReplayPage() {
  const { id, runId } = useParams<{ id: string; runId: string }>();
  const [run, setRun] = useState<RunDetail | null>(null);

  useEffect(() => {
    if (runId) api.getRun(runId).then(setRun).catch(() => setRun(null));
  }, [runId]);

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

      {!run ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <PageHeader
            eyebrow="Run replay"
            title="Execution trace"
            description={
              <span className="flex items-center gap-2">
                <StatusDot status={run.status} />
                {run.status} · started{" "}
                {parseDate(run.started_at)?.toLocaleString() ?? "—"}
              </span>
            }
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* conversation */}
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-2xl bg-accent-cyan/15 px-4 py-3 text-sm text-ink ring-1 ring-inset ring-accent-cyan/25">
                  {run.input}
                </div>
              </div>
              {run.status === "error" ? (
                <div className="glass-soft rounded-2xl px-4 py-3 text-sm text-accent-red">
                  {run.error || "Run failed."}
                </div>
              ) : (
                <div className="glass-soft whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed text-ink">
                  {run.output || "—"}
                </div>
              )}
            </div>

            {/* trace */}
            <div className="glass rounded-glass p-5">
              <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
                <BrainCircuit size={16} className="text-accent-cyan" />
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
