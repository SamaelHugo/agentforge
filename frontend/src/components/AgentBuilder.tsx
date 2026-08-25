"use client";

import { Check, FileText, Play, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api";
import { ALL_TOOL_NAMES, ACCENT, toolMeta } from "@/lib/tools";
import type { Agent } from "@/lib/types";
import { cn, errorMessage } from "@/lib/utils";
import { AgentNav } from "@/components/AgentNav";
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
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "gemini-2.0-flash",
];

export function AgentBuilder({ agent }: { agent?: Agent }) {
  const router = useRouter();
  const isEdit = Boolean(agent);
  const modelOptions =
    agent?.model && !MODELS.includes(agent.model)
      ? [agent.model, ...MODELS]
      : MODELS;

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
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!agent) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAgent(agent.id);
      router.push("/");
    } catch (e) {
      setError(errorMessage(e));
      setDeleting(false);
    }
  };

  return (
    <PageShell className="max-w-[1280px]">
      <PageHeader
        eyebrow={isEdit ? "Agent / Configuration" : "Agent / New"}
        title={isEdit ? agent!.name : "Create an agent."}
        description="Define a clear role, choose the capabilities it may use and keep its operating limits explicit."
        actions={
          <Button variant="primary" onClick={save} loading={saving}>
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saved ? "Saved" : isEdit ? "Save changes" : "Create agent"}
          </Button>
        }
      />

      {isEdit && agent && <AgentNav agentId={agent.id} />}

      {error && (
        <div role="alert" className="mb-8 border border-accent-red/40 bg-white px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {saved ? "Agent saved." : ""}
      </span>

      <div className="grid gap-14 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-8">
          <section className="grid gap-6 border-t border-line pt-5 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div>
              <p className="micro-label">01 / Identity</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">How the agent appears across the workspace.</p>
            </div>
            <div className="space-y-5">
              <Field label="Name">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Lead Qualifier" />
              </Field>
              <Field label="Description" hint="One clear sentence shown throughout the product.">
                <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What outcome does this agent produce?" />
              </Field>
            </div>
          </section>

          <section className="grid gap-6 border-t border-line pt-5 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div>
              <p className="micro-label">02 / Instructions</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">The role, boundaries and decision rules it follows.</p>
            </div>
            <Field label="System prompt" hint="Be explicit about goals, evidence and when tools should be used.">
              <Textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} rows={11} placeholder="You are a specialist that…" />
            </Field>
          </section>

          <section className="grid gap-6 border-t border-line pt-5 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div>
              <p className="micro-label">03 / Tools</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">Only enable capabilities this agent genuinely needs.</p>
            </div>
            <div className="grid grid-cols-1 border-t border-line sm:grid-cols-2">
              {ALL_TOOL_NAMES.map((toolName) => {
                const meta = toolMeta(toolName);
                const accent = ACCENT[meta.accent];
                const Icon = meta.icon;
                const selected = tools.includes(toolName);
                return (
                  <button
                    key={toolName}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleTool(toolName)}
                    className={cn(
                      "flex min-h-28 items-start gap-3 border-b border-line p-4 text-left transition-colors sm:odd:border-r",
                      selected ? "bg-white" : "bg-transparent hover:bg-white/60",
                    )}
                  >
                    <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center border border-line bg-white", accent.text)}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink">{meta.label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{meta.description}</span>
                    </span>
                    <span className={cn("ml-auto grid h-5 w-5 shrink-0 place-items-center border", selected ? "border-brand bg-brand text-white" : "border-line bg-white")}>
                      {selected && <Check size={12} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="grid gap-6 border-t border-line pt-5 sm:grid-cols-[150px_minmax(0,1fr)]">
            <div>
              <p className="micro-label">04 / Runtime</p>
              <p className="mt-3 text-xs leading-relaxed text-ink-muted">Model choice and response limits.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Model">
                <Select value={model} onChange={(event) => setModel(event.target.value)}>
                  {modelOptions.map((modelName) => <option key={modelName} value={modelName}>{modelName}</option>)}
                </Select>
              </Field>
              <Field label="Max tokens">
                <Input type="number" value={maxTokens} min={256} max={8192} onChange={(event) => setMaxTokens(Number(event.target.value))} />
              </Field>
              <Field label="Effort" hint="Claude 4.6+ only.">
                <Select value={effort} onChange={(event) => setEffort(event.target.value)}>
                  <option value="">default</option>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </Select>
              </Field>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-10 border-t border-ink py-5">
            <p className="micro-label">Live specification</p>
            <h2 className="mt-8 font-editorial text-4xl leading-none text-ink">{name || "Untitled agent"}</h2>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">{description || "Add a concise outcome-focused description."}</p>

            <dl className="mt-10 divide-y divide-line border-y border-line text-xs">
              <div className="flex justify-between gap-4 py-3"><dt className="text-ink-faint">Status</dt><dd className="font-medium uppercase tracking-[0.08em] text-ink">{agent?.status || "draft"}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-ink-faint">Model</dt><dd className="max-w-[190px] truncate font-mono text-ink">{model}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-ink-faint">Tools</dt><dd className="font-mono text-ink">{String(tools.length).padStart(2, "0")}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-ink-faint">Token limit</dt><dd className="font-mono text-ink">{maxTokens.toLocaleString()}</dd></div>
            </dl>

            {isEdit && agent && (
              <div className="mt-6 grid gap-2">
                <LinkButton href={`/playground/${agent.id}`} variant="primary"><Play size={15} />Open Playground</LinkButton>
                <LinkButton href={`/knowledge/${agent.id}`} variant="surface"><FileText size={15} />Knowledge ({agent.document_count})</LinkButton>
              </div>
            )}

            {isEdit && agent && (
              <div className="mt-12 border-t border-accent-red/40 pt-4">
                <p className="micro-label text-accent-red">Danger zone</p>
                <p className="mt-3 text-xs leading-relaxed text-ink-muted">Deletes this agent, its documents and run history.</p>
                {confirmDelete ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button variant="danger" onClick={remove} loading={deleting}>
                      <Trash2 size={15} />Confirm delete
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button variant="danger" onClick={() => setConfirmDelete(true)} className="mt-4">
                    <Trash2 size={15} />Delete agent
                  </Button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
