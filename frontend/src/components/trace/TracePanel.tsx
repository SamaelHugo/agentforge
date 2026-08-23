"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, BrainCircuit } from "lucide-react";
import { useEffect, useRef } from "react";

import type { TraceEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TraceStep } from "./TraceStep";

const RENDERABLE = new Set(["thinking", "tool_call", "result", "error", "final"]);

const LEGEND: { label: string; className: string }[] = [
  { label: "thinking", className: "bg-ink-faint" },
  { label: "tool call", className: "bg-accent-cyan" },
  { label: "result", className: "bg-accent-green" },
  { label: "error", className: "bg-accent-red" },
];

type Status = "idle" | "running" | "completed" | "error";

const STATUS_LABEL: Record<Status, string> = {
  idle: "Idle",
  running: "Reasoning…",
  completed: "Completed",
  error: "Error",
};

const STATUS_DOT: Record<Status, string> = {
  idle: "bg-ink-faint",
  running: "bg-accent-cyan animate-pulse-soft",
  completed: "bg-accent-green",
  error: "bg-accent-red",
};

export function TracePanel({
  events,
  status,
  className,
}: {
  events: TraceEvent[];
  status: Status;
  className?: string;
}) {
  const steps = events.filter((e) => RENDERABLE.has(e.type));
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [steps.length]);

  return (
    <section className={cn("flex h-full min-h-0 flex-col border-y border-line bg-white", className)}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit size={15} className="text-brand" />
          <h2 className="text-sm font-semibold tracking-[-0.02em] text-ink">
            Execution inspector
          </h2>
        </div>
        <span className="flex items-center gap-2 text-xs text-ink-muted">
          <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-line-soft px-5 py-2.5">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-ink-faint">
            <span className={cn("h-1.5 w-1.5 rounded-full", l.className)} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-auto px-5 py-5">
        {steps.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Activity size={22} className="mb-5 text-brand" />
            <p className="micro-label">Waiting for a run</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Tools, sources and execution events will appear here when the agent starts working.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {steps.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <TraceStep event={event} last={i === steps.length - 1} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
