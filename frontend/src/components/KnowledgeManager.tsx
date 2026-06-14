"use client";

import { FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

  const load = () =>
    api
      .listDocuments(agentId)
      .then(setDocs)
      .catch((e) => setError(String(e)));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

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
        <div className="rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
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
        <Button variant="glass" onClick={() => setShowText((s) => !s)}>
          {showText ? <X size={15} /> : <Plus size={15} />}
          {showText ? "Cancel" : "Paste text"}
        </Button>
      </div>

      {showText && (
        <div className="glass space-y-4 rounded-glass p-5">
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
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="glass flex items-center gap-4 rounded-xl px-5 py-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
                <FileText size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{doc.filename}</p>
                <p className="text-xs text-ink-muted">
                  {doc.chunk_count} chunks · {formatBytes(doc.size)} ·{" "}
                  {timeAgo(doc.created_at)}
                </p>
              </div>
              <button
                onClick={() => onDelete(doc.id)}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-accent-red/10 hover:text-accent-red"
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
