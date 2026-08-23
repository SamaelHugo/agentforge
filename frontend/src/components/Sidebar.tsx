"use client";

import {
  Boxes,
  Database,
  FileText,
  History,
  KeyRound,
  LogOut,
  type LucideIcon,
  Sparkles,
  SquareTerminal,
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
  icon: LucideIcon;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/",
    label: "Agents",
    icon: Boxes,
    match: (p) => p === "/" || p.startsWith("/agents"),
  },
  {
    href: "/playground",
    label: "Playground",
    icon: SquareTerminal,
    match: (p) => p.startsWith("/playground"),
  },
  {
    href: "/knowledge",
    label: "Knowledge Base",
    icon: FileText,
    match: (p) => p.startsWith("/knowledge"),
  },
  {
    href: "/runs",
    label: "Runs",
    icon: History,
    match: (p) => p.startsWith("/runs"),
  },
  {
    href: "/artifacts",
    label: "Artifacts",
    icon: Database,
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
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col gap-2 border-r border-line bg-surface p-5">
      <Link href="/" className="mb-6 flex items-center gap-3 px-2">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-brand/25">
          <Sparkles size={18} />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">
          AgentForge
        </span>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                active
                  ? "surface text-ink"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink",
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "transition-colors",
                  active ? "text-accent-cyan" : "text-ink-faint group-hover:text-ink-muted",
                )}
              />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 px-2">
        {authRequired &&
          (hasToken ? (
            <div className="flex items-center gap-2 rounded-xl border border-accent-green/20 bg-accent-green/[0.06] px-3 py-2.5">
              <KeyRound size={14} className="text-accent-green" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="micro-label">Access</p>
                <p className="truncate text-xs text-ink-muted">Token active</p>
              </div>
              <button
                type="button"
                onClick={clearToken}
                className="grid h-7 w-7 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-surface-raised hover:text-ink"
                aria-label="Clear access token"
                title="Clear access token"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <form
              onSubmit={unlock}
              className="rounded-xl border border-accent-amber/20 bg-accent-amber/[0.05] p-3"
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
                  className="field min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint"
                />
                <button
                  type="submit"
                  disabled={authBusy || !tokenInput.trim()}
                  className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-bg disabled:opacity-40"
                >
                  {authBusy ? "…" : "Unlock"}
                </button>
              </div>
              {authError && (
                <p className="mt-1.5 text-[11px] text-accent-red">{authError}</p>
              )}
            </form>
          ))}
        <div className="flex items-center gap-2 rounded-xl border border-line-soft bg-surface px-3 py-2.5">
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
