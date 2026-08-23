"use client";

import { FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";
import { formatBytes, timeAgo } from "@/lib/utils";
import { Button, EmptyState, Field, Input, Skeleton, Textarea } from "@/components/ui";

export function KnowledgeManager({ agentId }: { agentId: string }) {
  const [docs, setDocs] = useState<DocumentItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showText, setShowText] = useState(false);
  const [filename, setFilename] = useState("");
  const [content, setContent] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    return api
      .listDocuments(agentId)
      .then(setDocs)
      .catch((loadError) => setError(String(loadError)));
  }, [agentId]);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      await api.uploadDocument(agentId, file);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onAddText = async () => {
    if (!filename.trim() || !content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.addTextDocument(agentId, filename.trim(), content);
      setFilename("");
      setContent("");
      setShowText(false);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      await load();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="border-l-2 border-accent-red bg-white px-4 py-3 text-sm text-accent-red">
          {error}
        </div>
      )}

      {/* Add controls */}
      <div className="flex flex-wrap gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.pdf,.csv,.json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        />
        <Button
          variant="primary"
          onClick={() => fileRef.current?.click()}
          loading={busy}
        >
          <Upload size={15} />
          Upload file
        </Button>
        <Button variant="surface" onClick={() => setShowText((s) => !s)}>
          {showText ? <X size={15} /> : <Plus size={15} />}
          {showText ? "Cancel" : "Paste text"}
        </Button>
      </div>

      {showText && (
        <div className="grid gap-6 border-y border-line bg-white p-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-7">
          <div>
            <p className="micro-label">Manual source</p>
            <p className="mt-3 text-xs leading-relaxed text-ink-muted">Paste reliable source material and give it a title the agent can cite.</p>
          </div>
          <div className="space-y-4">
          <Field label="Title">
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="e.g. Product FAQ.md"
            />
          </Field>
          <Field label="Content">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Paste the document text to add to the knowledge base…"
            />
          </Field>
          <Button variant="primary" onClick={onAddText} loading={busy}>
            Add to knowledge base
          </Button>
          </div>
        </div>
      )}

      {/* Document list */}
      {docs === null ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload a PDF or paste text. It's chunked, embedded, and made searchable for this agent's RAG tool."
        />
      ) : (
        <div className="border-t border-line">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="grid gap-4 border-b border-line py-5 sm:grid-cols-[40px_minmax(0,1fr)_120px_40px] sm:items-center"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center border border-line bg-white text-brand">
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{doc.filename}</p>
                <p className="mt-1 text-xs text-ink-muted">{formatBytes(doc.size)} · added {timeAgo(doc.created_at)}</p>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">{doc.chunk_count} chunks</p>
              <button
                onClick={() => onDelete(doc.id)}
                className="grid h-8 w-8 place-items-center text-ink-faint transition-colors hover:text-accent-red"
                aria-label="Delete document"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
