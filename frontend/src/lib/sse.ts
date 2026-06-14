import { API_BASE } from "./api";
import type { TraceEvent } from "./types";

/**
 * Stream an agent run over Server-Sent Events.
 *
 * We POST the message and read the SSE body manually (the native EventSource
 * API only supports GET), parsing `data:` frames into TraceEvents and invoking
 * `onEvent` for each. Pass an AbortSignal to cancel mid-stream.
 */
export async function streamRun(
  agentId: string,
  message: string,
  opts: { onEvent: (event: TraceEvent) => void; signal?: AbortSignal },
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/agents/${agentId}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const dataLine = frame
        .split("\n")
        .find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (!payload) continue;
      try {
        opts.onEvent(JSON.parse(payload) as TraceEvent);
      } catch {
        /* skip malformed frame */
      }
    }
  }
}
