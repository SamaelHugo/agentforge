"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  error?: boolean;
}

/** Tiny inline formatter: **bold**, _italic_, `code`, and > blockquotes. */
function formatInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(<strong key={key++} className="font-semibold text-ink">{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key++} className="bg-surface-raised px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>);
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function MessageBody({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="my-2 border-l-2 border-brand/50 pl-3 font-editorial text-lg italic text-ink-muted"
            >
              {formatInline(line.slice(2))}
            </blockquote>
          );
        }
        return (
          <Fragment key={i}>
            {formatInline(line)}
            {i < lines.length - 1 && <br />}
          </Fragment>
        );
      })}
    </>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-ink-muted"
          style={{ animation: `pulse-soft 1.2s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
    </span>
  );
}

export function ChatPanel({
  messages,
  onSend,
  running,
  suggestions = [],
}: {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  running: boolean;
  suggestions?: string[];
}) {
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, running]);

  const submit = () => {
    const text = value.trim();
    if (!text || running) return;
    onSend(text);
    setValue("");
  };

  const showThinking = running && messages[messages.length - 1]?.role === "user";

  return (
    <section className="flex h-full min-h-0 flex-col border-y border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <p className="micro-label">Conversation</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-faint">Live session</p>
      </div>
      <div className="flex-1 space-y-8 overflow-auto px-5 py-7 sm:px-8 sm:py-9">
        {messages.length === 0 && (
          <div className="flex h-full min-h-[420px] flex-col justify-end">
            <p className="micro-label text-brand">Ask / test / observe</p>
            <h3 className="mt-5 max-w-xl font-editorial text-5xl leading-[0.95] tracking-[-0.03em] text-ink sm:text-6xl">
              Give the agent a real task.
            </h3>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-muted">
              Start with an outcome. The execution inspector records tools, sources and errors without interrupting the conversation.
            </p>
            {suggestions.length > 0 && (
              <div className="mt-10 border-t border-line">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSend(suggestion)}
                    disabled={running}
                    className="group grid w-full grid-cols-[32px_1fr_auto] gap-3 border-b border-line py-3 text-left text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
                  >
                    <span className="font-mono text-[9px] text-ink-faint">{String(index + 1).padStart(2, "0")}</span>
                    <span>{suggestion}</span>
                    <ArrowUp size={13} className="rotate-45 text-ink-faint transition-colors group-hover:text-brand" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={`${message.role}-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22 }}
            className="grid gap-3 border-b border-line-soft pb-8 sm:grid-cols-[72px_minmax(0,1fr)]"
          >
            <p className={cn("micro-label pt-1", message.role === "assistant" && "text-brand")}>
              {message.role === "user" ? "You" : "Agent"}
            </p>
            <div
              className={cn(
                "max-w-3xl text-[15px] leading-[1.75]",
                message.role === "user" ? "font-medium text-ink" : message.error ? "text-accent-red" : "text-ink",
              )}
            >
              <MessageBody text={message.text} />
            </div>
          </motion.div>
        ))}

        {showThinking && (
          <div className="grid gap-3 sm:grid-cols-[72px_minmax(0,1fr)]">
            <p className="micro-label pt-1 text-brand">Agent</p>
            <div className="py-1">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line bg-white p-4 sm:p-5">
        <div className="field flex items-end gap-2 rounded-[2px] p-2">
          <textarea
            aria-label="Agent message"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Give the agent a task…  (Enter to send)"
            className="max-h-36 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={submit}
            disabled={running || !value.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center bg-ink text-white transition-colors hover:bg-brand disabled:opacity-40"
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
