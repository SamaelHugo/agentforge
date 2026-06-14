"use client";

import { ArrowLeft, Settings2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatPanel, type ChatMessage } from "@/components/chat/ChatPanel";
import { TracePanel } from "@/components/trace/TracePanel";
import { ToolPill } from "@/components/ToolPill";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { streamRun } from "@/lib/sse";
import type { Agent, TraceEvent } from "@/lib/types";

type Status = "idle" | "running" | "completed" | "error";

function suggestionsFor(agent: Agent): string[] {
  const name = agent.name.toLowerCase();
  if (name.includes("lead")) {
    return [
      "Acme Corp — 800-person fintech on Snowflake, 9 data sources, evaluating tools. Good fit?",
      "A 20-person agency with no warehouse just signed up. Are they qualified?",
    ];
  }
  if (name.includes("support")) {
    return [
      "How often do syncs run on the Growth tier?",
      "How do I reset a connector, and how long does it take?",
      "Do you support a Databricks destination?",
    ];
  }
  if (name.includes("research")) {
    return [
      "Write a short briefing on the AI agent market in 2026.",
      "What skills are most in demand for AI engineers right now?",
    ];
  }
  return [
    "What can you help me with, and what's in your knowledge base?",
    "Give me a quick demo of what you can do.",
  ];
}

export default function PlaygroundPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const abortRef = useRef<AbortController | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    if (id) api.getAgent(id).then(setAgent).catch(() => setAgent(null));
    return () => abortRef.current?.abort();
  }, [id]);

  const send = useCallback(
    async (text: string) => {
      if (!id || status === "running") return;
      setMessages((m) => [...m, { role: "user", text }]);
      setEvents([]);
      finalRef.current = "";
      setStatus("running");

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let finished = false;

      try {
        await streamRun(id, text, {
          signal: ctrl.signal,
          onEvent: (e) => {
            if (e.type === "start") return;
            if (e.type === "final") {
              finalRef.current = e.content.text || "";
              return;
            }
            if (e.type === "done") {
              finished = true;
              const isErr = e.content.status === "error";
              const out = isErr
                ? e.content.error || "Something went wrong."
                : finalRef.current || e.content.output || "(no answer)";
              setMessages((m) => [
                ...m,
                { role: "assistant", text: out, error: isErr },
              ]);
              setStatus(isErr ? "error" : "completed");
              return;
            }
            setEvents((prev) => [...prev, e]);
          },
        });

        // Stream closed without a terminal `done` event — never leave the UI stuck.
        if (!finished) {
          const text2 = finalRef.current || "The run ended unexpectedly.";
          setMessages((m) => [
            ...m,
            { role: "assistant", text: text2, error: !finalRef.current },
          ]);
          setStatus(finalRef.current ? "completed" : "error");
        }
      } catch (err) {
        // Intentional cancellation (navigation / new run) is not an error.
        if (ctrl.signal.aborted || (err as { name?: string })?.name === "AbortError") {
          return;
        }
        setMessages((m) => [
          ...m,
          { role: "assistant", text: String(err), error: true },
        ]);
        setStatus("error");
      }
    },
    [id, status],
  );

  if (!agent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-4 border-b border-white/10 px-8 py-4">
        <Link
          href="/playground"
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
            {agent.name}
          </h1>
          <p className="truncate text-xs text-ink-muted">
            <span className="font-mono">{agent.model}</span> · {agent.description}
          </p>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          {agent.tools.map((t) => (
            <ToolPill key={t} name={t} />
          ))}
        </div>
        <Link
          href={`/agents/${agent.id}`}
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-muted transition-colors hover:bg-white/5 hover:text-ink"
        >
          <Settings2 size={18} />
        </Link>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 p-6 lg:grid-cols-2">
        <ChatPanel
          messages={messages}
          onSend={send}
          running={status === "running"}
          suggestions={messages.length === 0 ? suggestionsFor(agent) : []}
        />
        <TracePanel events={events} status={status} />
      </div>
    </div>
  );
}
