import {
  Database,
  Globe,
  Mail,
  Search,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Accent } from "./types";

export interface ToolMeta {
  name: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: Accent;
}

/** Static mirror of the backend tool catalog — lets us render a tool by name
 *  without waiting on an API call. */
export const TOOL_META: Record<string, ToolMeta> = {
  search_knowledge: {
    name: "search_knowledge",
    label: "Search Knowledge",
    description: "Semantic search over the agent's documents (RAG).",
    icon: Search,
    accent: "cyan",
  },
  draft_email: {
    name: "draft_email",
    label: "Draft Email",
    description: "Compose a professional email from key points.",
    icon: Mail,
    accent: "violet",
  },
  save_to_db: {
    name: "save_to_db",
    label: "Save to DB",
    description: "Persist a result — tool use with real side effects.",
    icon: Database,
    accent: "green",
  },
  web_search: {
    name: "web_search",
    label: "Web Search",
    description: "Search the web for recent info (mock integration).",
    icon: Globe,
    accent: "amber",
  },
};

export const ALL_TOOL_NAMES = Object.keys(TOOL_META);

export function toolMeta(name: string): ToolMeta {
  return (
    TOOL_META[name] ?? {
      name,
      label: name,
      description: "",
      icon: Wrench,
      accent: "cyan",
    }
  );
}

/** Static accent → Tailwind class sets (kept literal so JIT picks them up). */
export const ACCENT: Record<
  Accent,
  { text: string; bg: string; border: string; dot: string; glow: string }
> = {
  cyan: {
    text: "text-accent-cyan",
    bg: "bg-accent-cyan/10",
    border: "border-accent-cyan/30",
    dot: "bg-accent-cyan",
    glow: "shadow-[0_0_10px_rgba(34,211,238,0.7)]",
  },
  violet: {
    text: "text-accent-violet",
    bg: "bg-accent-violet/10",
    border: "border-accent-violet/30",
    dot: "bg-accent-violet",
    glow: "shadow-[0_0_10px_rgba(139,92,246,0.7)]",
  },
  green: {
    text: "text-accent-green",
    bg: "bg-accent-green/10",
    border: "border-accent-green/30",
    dot: "bg-accent-green",
    glow: "shadow-[0_0_10px_rgba(74,222,128,0.7)]",
  },
  amber: {
    text: "text-accent-amber",
    bg: "bg-accent-amber/10",
    border: "border-accent-amber/30",
    dot: "bg-accent-amber",
    glow: "shadow-[0_0_10px_rgba(251,191,36,0.7)]",
  },
  red: {
    text: "text-accent-red",
    bg: "bg-accent-red/10",
    border: "border-accent-red/30",
    dot: "bg-accent-red",
    glow: "shadow-[0_0_10px_rgba(248,113,113,0.7)]",
  },
};
