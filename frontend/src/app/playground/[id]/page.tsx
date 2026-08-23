"use client";

import { ArrowLeft, PanelRightClose, PanelRightOpen, Settings2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatPanel, type ChatMessage } from "@/components/chat/ChatPanel";
import { TracePanel } from "@/components/trace/TracePanel";
import { ToolPill } from "@/components/ToolPill";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { streamRun } from "@/lib/sse";
import type { Agent, ConversationTurn, TraceEvent } from "@/lib/types";

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

function successfulHistory(messages: ChatMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  for (let index = 0; index + 1 < messages.length; index += 2) {
    const user = messages[index];
    const assistant = messages[index + 1];
    if (
      user.role === "user" &&
      assistant.role === "assistant" &&
      !assistant.error
    ) {
      turns.push(
        { role: "user", content: user.text },
        { role: "assistant", content: assistant.text },
      );
    }
  }
  return turns.slice(-20);
}

export default function PlaygroundPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [traceOpen, setTraceOpen] = useState(false);
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
          history: successfulHistory(messages),
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
    [id, messages, status],
  );

  if (!agent) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-126px)] flex-col md:h-screen md:min-h-0">
      <header className="grid gap-4 border-b border-line bg-surface px-5 py-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center md:px-8">
        <Link
          href="/playground"
          className="grid h-9 w-9 place-items-center border border-line bg-white text-ink-muted transition-colors hover:border-ink hover:text-ink"
          aria-label="Back to agent selection"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-semibold tracking-[-0.04em] text-ink">
            {agent.name}
            </h1>
            <span className="micro-label text-brand">{status}</span>
          </div>
          <p className="mt-1 truncate text-xs text-ink-muted">{agent.description}</p>
        </div>
        <div className="col-span-full flex items-center gap-2 sm:col-span-1">
          <div className="mr-2 hidden items-center gap-1.5 xl:flex">
            {agent.tools.slice(0, 3).map((tool) => <ToolPill key={tool} name={tool} />)}
          </div>
          <button
            type="button"
            onClick={() => setTraceOpen((open) => !open)}
            className="inline-flex h-9 items-center gap-2 border border-line bg-white px-3 text-xs font-medium text-ink-muted transition-colors hover:border-ink hover:text-ink"
            aria-label={traceOpen ? "Hide execution inspector" : "Show execution inspector"}
          >
            {traceOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            <span className="hidden sm:inline">Inspector</span>
            {events.length > 0 && <span className="font-mono text-[9px] text-brand">{events.length}</span>}
          </button>
          <Link
            href={`/agents/${agent.id}`}
            className="grid h-9 w-9 place-items-center border border-line bg-white text-ink-muted transition-colors hover:border-ink hover:text-ink"
            aria-label="Agent settings"
          >
            <Settings2 size={16} />
          </Link>
        </div>
      </header>

      <div className={`grid min-h-0 flex-1 grid-cols-1 gap-5 p-4 sm:p-5 ${traceOpen ? "lg:grid-cols-[minmax(0,1.65fr)_minmax(360px,.85fr)]" : "lg:grid-cols-1"}`}>
        <ChatPanel
          messages={messages}
          onSend={send}
          running={status === "running"}
          suggestions={messages.length === 0 ? suggestionsFor(agent) : []}
        />
        {traceOpen && <TracePanel events={events} status={status} />}
      </div>
    </div>
  );
}
