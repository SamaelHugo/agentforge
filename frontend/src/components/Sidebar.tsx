"use client";

import {
  KeyRound,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  API_BASE,
  API_TOKEN_KEY,
  apiAuthHeaders,
  readApiToken,
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  index: string;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Agents",
    index: "01",
    match: (p) => p === "/" || p.startsWith("/agents"),
  },
  {
    href: "/playground",
    label: "Playground",
    index: "02",
    match: (p) => p.startsWith("/playground"),
  },
  {
    href: "/knowledge",
    label: "Knowledge Base",
    index: "03",
    match: (p) => p.startsWith("/knowledge"),
  },
  {
    href: "/runs",
    label: "Runs",
    index: "04",
    match: (p) => p.startsWith("/runs"),
  },
  {
    href: "/artifacts",
    label: "Artifacts",
    index: "05",
    match: (p) => p.startsWith("/artifacts"),
  },
];

/** The backend reports whichever LLM provider actually resolved — show that,
 *  instead of assuming anything non-Anthropic is the offline mock. */
const ENGINE_LABEL: Record<string, string> = {
  groq: "Groq · live",
  openai: "OpenAI · live",
  anthropic: "Claude · live",
  gemini: "Gemini · live",
};

function describeEngine(provider: string | null): { label: string; dot: string } {
  if (provider === null) return { label: "connecting…", dot: "bg-ink-faint" };
  if (provider === "offline") return { label: "backend offline", dot: "bg-accent-red" };
  if (provider === "mock")
    return { label: "mock (offline)", dot: "bg-accent-amber animate-pulse-soft" };
  return {
    label: ENGINE_LABEL[provider] ?? `${provider} · live`,
    dot: "bg-accent-green animate-pulse-soft",
  };
}

export function Sidebar() {
  const pathname = usePathname();
  const [provider, setProvider] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const engine = describeEngine(provider);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setHasToken(Boolean(readApiToken()));
        setProvider(d.llm_provider);
        setAuthRequired(Boolean(d.auth_required));
      })
      .catch(() => setProvider("offline"));
  }, []);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_BASE}/api/agents`, {
        headers: apiAuthHeaders(token),
      });
      if (!response.ok) throw new Error("Invalid access token");
      window.sessionStorage.setItem(API_TOKEN_KEY, token);
      setHasToken(true);
      setTokenInput("");
      window.location.reload();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not authenticate");
    } finally {
      setAuthBusy(false);
    }
  };

  const clearToken = () => {
    window.sessionStorage.removeItem(API_TOKEN_KEY);
    setHasToken(false);
    window.location.reload();
  };

  return (
    <aside className="sticky top-0 z-30 flex w-full shrink-0 flex-col border-b border-line bg-surface/95 px-5 py-4 md:h-screen md:w-[232px] md:border-b-0 md:border-r md:px-6 md:py-7">
      <Link href="/" className="flex items-center gap-3 md:mb-14">
        <span className="grid h-9 w-9 place-items-center bg-brand font-display text-[11px] font-semibold tracking-[-0.04em] text-white">
          AF
        </span>
        <span className="leading-none">
          <span className="block font-display text-base font-semibold tracking-[-0.035em]">AgentForge</span>
          <span className="mt-1 block text-[9px] uppercase tracking-[0.17em] text-ink-faint">AI operations</span>
        </span>
      </Link>

      <nav className="mt-4 flex gap-1 overflow-x-auto md:mt-0 md:flex-col md:gap-0">
        {NAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex shrink-0 items-center gap-3 border-t px-1 py-3 text-sm transition-colors md:w-full",
                active
                  ? "border-ink text-ink"
                  : "border-line-soft text-ink-muted hover:border-line hover:text-ink",
              )}
            >
              <span className={cn("font-mono text-[9px]", active ? "text-brand" : "text-ink-faint")}>{item.index}</span>
              <span className="font-medium tracking-[-0.01em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden space-y-4 md:block">
        {authRequired &&
          (hasToken ? (
            <div className="flex items-center gap-2 border-t border-line pt-4">
              <KeyRound size={14} className="text-accent-green" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="micro-label">Access</p>
                <p className="truncate text-xs text-ink-muted">Token active</p>
              </div>
              <button
                type="button"
                onClick={clearToken}
                className="grid h-7 w-7 place-items-center text-ink-faint transition-colors hover:text-ink"
                aria-label="Clear access token"
                title="Clear access token"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <form
              onSubmit={unlock}
              className="border-t border-line pt-4"
            >
              <label
                htmlFor="agentforge-access-token"
                className="micro-label mb-2 flex items-center gap-1.5"
              >
                <KeyRound size={12} />
                Access token
              </label>
              <div className="flex gap-1.5">
                <input
                  id="agentforge-access-token"
                  type="password"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Required"
                  autoComplete="current-password"
                  className="field min-w-0 flex-1 rounded-[2px] px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint"
                />
                <button
                  type="submit"
                  disabled={authBusy || !tokenInput.trim()}
                  className="rounded-[2px] bg-ink px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                >
                  {authBusy ? "…" : "Unlock"}
                </button>
              </div>
              {authError && (
                <p className="mt-1.5 text-[11px] text-accent-red">{authError}</p>
              )}
            </form>
          ))}
        <div className="flex items-center gap-2 border-t border-line pt-4">
          <span
            className={cn("h-2 w-2 rounded-full", engine.dot)}
          />
          <div className="leading-tight">
            <p className="micro-label">Engine</p>
            <p className="text-xs text-ink-muted">{engine.label}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
