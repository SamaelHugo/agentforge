// API contract types — mirror backend/app/schemas.py

export type Accent = "cyan" | "violet" | "green" | "amber" | "red";

export interface ToolInfo {
  name: string;
  label: string;
  description: string;
  icon: string;
  accent: Accent;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  model: string;
  settings: Record<string, unknown>;
  status: string;
  tools: string[];
  run_count: number;
  document_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  settings?: Record<string, unknown>;
  tools?: string[];
}

export type AgentUpdate = Partial<AgentCreate> & { status?: string };

export interface DocumentItem {
  id: string;
  agent_id: string;
  filename: string;
  size: number;
  chunk_count: number;
  created_at: string;
}

export type StepType =
  | "thinking"
  | "tool_call"
  | "result"
  | "error"
  | "final";

export interface RunStep {
  id: string;
  step_index: number;
  type: StepType;
  content: Record<string, any>;
  created_at: string;
}

export interface Run {
  id: string;
  agent_id: string;
  input: string;
  output: string;
  status: "running" | "completed" | "error";
  error: string | null;
  started_at: string;
  finished_at: string | null;
}

export interface RunDetail extends Run {
  steps: RunStep[];
}

// SSE trace events (type adds the stream-only meta events)
export type TraceEventType = StepType | "start" | "done";

export interface TraceEvent {
  type: TraceEventType;
  content: Record<string, any>;
}

export interface Artifact {
  id: string;
  kind: string;
  title: string;
  content: string;
  data: Record<string, unknown>;
  run_id: string | null;
  created_at: string;
}
