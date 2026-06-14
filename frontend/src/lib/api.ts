import type {
  Agent,
  AgentCreate,
  AgentUpdate,
  Artifact,
  DocumentItem,
  Run,
  RunDetail,
  ToolInfo,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // tools
  listTools: () => request<ToolInfo[]>("/api/tools"),

  // agents
  listAgents: () => request<Agent[]>("/api/agents"),
  getAgent: (id: string) => request<Agent>(`/api/agents/${id}`),
  createAgent: (payload: AgentCreate) =>
    request<Agent>("/api/agents", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAgent: (id: string, payload: AgentUpdate) =>
    request<Agent>(`/api/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteAgent: (id: string) =>
    request<void>(`/api/agents/${id}`, { method: "DELETE" }),

  // documents
  listDocuments: (agentId: string) =>
    request<DocumentItem[]>(`/api/agents/${agentId}/documents`),
  addTextDocument: (agentId: string, filename: string, content: string) =>
    request<DocumentItem>(`/api/agents/${agentId}/documents/text`, {
      method: "POST",
      body: JSON.stringify({ filename, content }),
    }),
  uploadDocument: async (agentId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/api/agents/${agentId}/documents/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        detail = (await res.json()).detail || detail;
      } catch {
        /* ignore */
      }
      throw new Error(`${res.status}: ${detail}`);
    }
    return (await res.json()) as DocumentItem;
  },
  deleteDocument: (documentId: string) =>
    request<void>(`/api/documents/${documentId}`, { method: "DELETE" }),

  // runs
  listRuns: (agentId: string) => request<Run[]>(`/api/agents/${agentId}/runs`),
  getRun: (runId: string) => request<RunDetail>(`/api/runs/${runId}`),

  // artifacts
  listArtifacts: (agentId: string) =>
    request<Artifact[]>(`/api/agents/${agentId}/artifacts`),
};
