import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";

import { ACCENT, toolMeta } from "@/lib/tools";
import type { TraceEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/8 bg-black/30 p-3 font-mono text-[12px] leading-relaxed text-ink-muted">
      {children}
    </pre>
  );
}

function StepShell({
  dotClass,
  icon,
  label,
  labelClass,
  children,
  last,
}: {
  dotClass: string;
  icon: React.ReactNode;
  label: string;
  labelClass: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className="relative flex gap-3">
      <div className="flex flex-col items-center pt-1">
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-full",
            dotClass,
          )}
        >
          {icon}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-white/10" />}
      </div>
      <div className="min-w-0 flex-1 pb-5">
        <p className={cn("mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]", labelClass)}>
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

export function TraceStep({ event, last }: { event: TraceEvent; last?: boolean }) {
  const { type, content } = event;

  if (type === "thinking") {
    return (
      <StepShell
        last={last}
        dotClass="bg-white/[0.06] text-ink-muted"
        icon={<Brain size={13} />}
        label="Thinking"
        labelClass="text-ink-faint"
      >
        <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-ink-muted">
          {content.text}
        </p>
      </StepShell>
    );
  }

  if (type === "tool_call") {
    const meta = toolMeta(content.tool);
    const accent = ACCENT[meta.accent];
    const Icon = meta.icon;
    return (
      <StepShell
        last={last}
        dotClass={cn(accent.bg, accent.text)}
        icon={<Icon size={13} />}
        label="Tool Call"
        labelClass={accent.text}
      >
        <p className="text-sm text-ink">
          Calling <span className={cn("font-mono", accent.text)}>{content.tool}</span>
        </p>
        <CodeBlock>{JSON.stringify(content.input ?? {}, null, 2)}</CodeBlock>
      </StepShell>
    );
  }

  if (type === "result") {
    const meta = toolMeta(content.tool);
    const data = content.data ?? {};
    return (
      <StepShell
        last={last}
        dotClass={cn(ACCENT.green.bg, ACCENT.green.text)}
        icon={<CheckCircle2 size={13} />}
        label="Result"
        labelClass="text-accent-green"
      >
        <p className="text-sm text-ink-muted">
          <span className="font-mono text-accent-green">{content.tool}</span> returned:
        </p>

        {Array.isArray(data.hits) && data.hits.length > 0 ? (
          <div className="mt-2 space-y-2">
            {data.hits.map((hit: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/[0.04] p-2.5"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 truncate text-xs text-accent-cyan">
                    <FileText size={12} />
                    {hit.filename}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-ink-faint">
                    {Number(hit.score).toFixed(3)}
                  </span>
                </div>
                <p className="line-clamp-3 text-[13px] leading-relaxed text-ink-muted">
                  {hit.content}
                </p>
              </div>
            ))}
          </div>
        ) : Array.isArray(data.results) && data.results.length > 0 ? (
          <div className="mt-2 space-y-2">
            {data.results.map((r: any, i: number) => (
              <div
                key={i}
                className="rounded-lg border border-accent-amber/20 bg-accent-amber/[0.04] p-2.5"
              >
                <p className="text-[13px] font-medium text-ink">{r.title}</p>
                <p className="truncate text-[11px] text-accent-amber">{r.url}</p>
                <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">
                  {r.snippet}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <CodeBlock>{content.output ?? ""}</CodeBlock>
        )}
      </StepShell>
    );
  }

  if (type === "error") {
    return (
      <StepShell
        last={last}
        dotClass={cn(ACCENT.red.bg, ACCENT.red.text)}
        icon={<AlertTriangle size={13} />}
        label="Error"
        labelClass="text-accent-red"
      >
        <p className="text-sm text-accent-red/90">{content.message}</p>
      </StepShell>
    );
  }

  if (type === "final") {
    return (
      <StepShell
        last={last}
        dotClass={cn(ACCENT.green.bg, ACCENT.green.text)}
        icon={<Sparkles size={13} />}
        label="Final Answer"
        labelClass="text-accent-green"
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {content.text}
        </p>
      </StepShell>
    );
  }

  return null;
}
