"use client";

import { motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
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
        <code key={key++} className="rounded bg-white/10 px-1 py-0.5 font-mono text-[0.85em]">
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
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="my-1 border-l-2 border-accent-cyan/40 pl-3 italic text-ink-muted"
            >
              {formatInline(line.slice(2))}
            </blockquote>
          );
        }
        return (
          <Fragment key={i}>
            {formatInline(line)}
            {i < text.split("\n").length - 1 && <br />}
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
          style={{ animation: `pulse-glow 1.2s ease-in-out ${i * 0.18}s infinite` }}
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
    <div className="glass flex h-full flex-col rounded-glass">
      <div className="flex-1 space-y-5 overflow-auto px-6 py-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent-cyan/15 text-accent-cyan">
              <Sparkles size={22} />
            </span>
            <h3 className="font-display text-lg text-ink">Send the agent a task</h3>
            <p className="mt-2 max-w-xs text-sm text-ink-muted">
              Watch it reason, call tools, and answer — live, on the right.
            </p>
            {suggestions.length > 0 && (
              <div className="mt-6 flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => onSend(s)}
                    disabled={running}
                    className="glass-soft rounded-xl px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                m.role === "user"
                  ? "bg-accent-cyan/15 text-ink ring-1 ring-inset ring-accent-cyan/25"
                  : m.error
                    ? "glass-soft text-accent-red"
                    : "glass-soft text-ink",
              )}
            >
              <MessageBody text={m.text} />
            </div>
          </motion.div>
        ))}

        {showThinking && (
          <div className="flex justify-start">
            <div className="glass-soft rounded-2xl px-4 py-3">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="glass-input flex items-end gap-2 rounded-2xl p-2">
          <textarea
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
            onClick={submit}
            disabled={running || !value.trim()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-cyan/20 text-accent-cyan ring-1 ring-inset ring-accent-cyan/40 transition-all hover:bg-accent-cyan/30 disabled:opacity-40"
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
