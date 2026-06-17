"use client";

import { Check, FileText, Play, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";
import { ALL_TOOL_NAMES, ACCENT, toolMeta } from "@/lib/tools";
import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Button,
  Field,
  Input,
  LinkButton,
  PageHeader,
  PageShell,
  Select,
  Textarea,
} from "@/components/ui";

const MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it",
  "gemini-2.0-flash",
];

export function AgentBuilder({ agent }: { agent?: Agent }) {
  const router = useRouter();
  const isEdit = Boolean(agent);

  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.system_prompt ?? "");
  const [model, setModel] = useState(agent?.model ?? MODELS[0]);
  const [tools, setTools] = useState<string[]>(agent?.tools ?? []);
  const [maxTokens, setMaxTokens] = useState<number>(
    Number(agent?.settings?.max_tokens) || 4096,
  );
  const [effort, setEffort] = useState<string>(
    (agent?.settings?.effort as string) || "",
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTool = (toolName: string) => {
    setTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((t) => t !== toolName)
        : [...prev, toolName],
    );
  };

  const save = async () => {
    if (!name.trim()) {
      setError("Give your agent a name.");
      return;
    }
    setSaving(true);
    setError(null);
    const settings: Record<string, unknown> = { max_tokens: maxTokens };
    if (effort) settings.effort = effort;
    const payload = {
      name: name.trim(),
      description,
      system_prompt: systemPrompt,
      model,
      tools,
      settings,
    };
    try {
      if (isEdit && agent) {
        await api.updateAgent(agent.id, payload);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const created = await api.createAgent(payload);
        router.push(`/agents/${created.id}`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!agent) return;
    if (!confirm(`Delete "${agent.name}"? This removes its documents and runs.`)) return;
    try {
      await api.deleteAgent(agent.id);
      router.push("/");
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        eyebrow={isEdit ? "Agent Builder" : "New Agent"}
        title={isEdit ? agent!.name : "Create an agent"}
        description="Define its persona, give it tools, and connect a knowledge base."
        actions={
          <Button variant="primary" onClick={save} loading={saving}>
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saved ? "Saved" : isEdit ? "Save changes" : "Create agent"}
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Identity */}
        <section className="space-y-4">
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lead Qualifier"
            />
          </Field>
          <Field label="Description" hint="Shown on the agent card.">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One line describing what this agent does."
            />
          </Field>
        </section>

        {/* Instructions */}
        <section>
          <Field
            label="System Prompt"
            hint="The agent's instructions — how it should reason and behave."
          >
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={8}
              placeholder="You are a helpful assistant that…"
            />
          </Field>
        </section>

        {/* Tools */}
        <section>
          <p className="micro-label mb-3">Tools</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ALL_TOOL_NAMES.map((toolName) => {
              const meta = toolMeta(toolName);
              const accent = ACCENT[meta.accent];
              const Icon = meta.icon;
              const selected = tools.includes(toolName);
              return (
                <button
                  key={toolName}
                  type="button"
                  onClick={() => toggleTool(toolName)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                    selected
                      ? cn(accent.bg, accent.border)
                      : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      selected ? cn(accent.bg, accent.text) : "bg-white/[0.05] text-ink-faint",
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        selected ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="block text-xs leading-snug text-ink-faint">
                      {meta.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "ml-auto grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all",
                      selected
                        ? cn(accent.dot, "border-transparent text-bg")
                        : "border-white/15",
                    )}
                  >
                    {selected && <Check size={12} className="text-bg" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Model & settings */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Model">
            <Select value={model} onChange={(e) => setModel(e.target.value)}>
              {MODELS.map((m) => (
                <option key={m} value={m} className="bg-bg">
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Max Tokens">
            <Input
              type="number"
              value={maxTokens}
              min={256}
              max={8192}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
            />
          </Field>
          <Field label="Effort" hint="Reasoning depth (Claude 4.6+).">
            <Select value={effort} onChange={(e) => setEffort(e.target.value)}>
              <option value="" className="bg-bg">default</option>
              <option value="low" className="bg-bg">low</option>
              <option value="medium" className="bg-bg">medium</option>
              <option value="high" className="bg-bg">high</option>
            </Select>
          </Field>
        </section>

        {/* Edit-only: quick links + danger zone */}
        {isEdit && agent && (
          <>
            <section className="flex flex-wrap gap-3 border-t border-white/8 pt-6">
              <LinkButton href={`/playground/${agent.id}`} variant="primary">
                <Play size={15} />
                Open in Playground
              </LinkButton>
              <LinkButton href={`/knowledge/${agent.id}`} variant="glass">
                <FileText size={15} />
                Knowledge Base ({agent.document_count})
              </LinkButton>
            </section>
            <section className="rounded-xl border border-accent-red/20 bg-accent-red/[0.04] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-ink">Delete agent</p>
                  <p className="text-xs text-ink-muted">
                    Permanently removes this agent, its documents, and run history.
                  </p>
                </div>
                <Button variant="danger" onClick={remove}>
                  <Trash2 size={15} />
                  Delete
                </Button>
              </div>
            </section>
          </>
        )}
      </div>
    </PageShell>
  );
}
