"""The ReAct loop.

A from-scratch agent loop (no LangChain): prompt → LLM → optional tool calls →
feed results back → repeat until the model answers. It's a generator: each step
is yielded as a trace event so the API can stream the agent's "thinking" to the
UI in real time and persist every step.

  user message
      │
      ▼
  ┌─────────── LLM completion ───────────┐
  │  thinking?  → yield thinking event    │
  │  tool_use?  → run tool, yield events, │◀── loop while stop_reason == tool_use
  │              feed tool_result back     │
  │  end_turn?  → yield final event, stop │
  └───────────────────────────────────────┘
"""
from __future__ import annotations

import logging
from collections.abc import Iterator
from typing import Any

from ..config import get_settings
from ..llm import LLMProvider, get_llm_provider
from ..tools import ToolContext, ToolResult, build_tool_schemas, get_tool
from . import events

logger = logging.getLogger("agentforge.engine")

MAX_STEPS = 8
_VALID_EFFORT = {"low", "medium", "high", "max"}


class ReActEngine:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self.provider = provider or get_llm_provider()

    def run(
        self,
        ctx: ToolContext,
        *,
        user_message: str,
        max_steps: int = MAX_STEPS,
    ) -> Iterator[dict[str, Any]]:
        settings = get_settings()
        agent = ctx.agent

        tool_names = [t.tool_name for t in agent.tools]
        tool_schemas = build_tool_schemas(tool_names)

        agent_settings = agent.settings or {}
        model = agent.model or settings.default_model
        try:
            max_tokens = int(agent_settings.get("max_tokens") or settings.max_tokens)
        except (TypeError, ValueError):
            max_tokens = settings.max_tokens
        max_tokens = max(256, min(max_tokens, 8192))  # clamp untrusted settings
        effort = agent_settings.get("effort")
        if effort not in _VALID_EFFORT:
            effort = None
        system = agent.system_prompt or ""

        messages: list[dict[str, Any]] = [{"role": "user", "content": user_message}]

        for _ in range(max_steps):
            try:
                result = self.provider.complete(
                    system=system,
                    messages=messages,
                    tools=tool_schemas,
                    model=model,
                    max_tokens=max_tokens,
                    effort=effort,
                )
            except Exception:  # fatal — no final event → run marked errored
                logger.exception("LLM request failed")
                yield events.error(
                    "The language model request failed. Check the server logs for details."
                )
                return

            if result.thinking:
                yield events.thinking(result.thinking)

            if result.stop_reason == "tool_use" and result.tool_calls:
                # any interim assistant text before the tool calls
                if result.text:
                    yield events.thinking(result.text)

                messages.append(
                    {"role": "assistant", "content": result.raw_assistant_content}
                )

                tool_result_blocks: list[dict[str, Any]] = []
                for call in result.tool_calls:
                    yield events.tool_call(call.name, call.input)

                    tool = get_tool(call.name)
                    if tool is None:
                        out = ToolResult(output=f"Unknown tool: {call.name}")
                        yield events.error(f"Unknown tool: {call.name}", tool=call.name)
                    else:
                        try:
                            out = tool.run(ctx, **call.input)
                        except Exception as exc:
                            out = ToolResult(output=f"Tool error: {exc}", data={"error": str(exc)})
                            yield events.error(f"Tool '{call.name}' failed: {exc}", tool=call.name)

                    yield events.result(call.name, out.output, out.data)
                    tool_result_blocks.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": call.id,
                            "content": out.output,
                        }
                    )

                messages.append({"role": "user", "content": tool_result_blocks})
                continue

            # no tool calls → final answer
            yield events.final(result.text or "(The agent produced no text response.)")
            return

        yield events.final("Reached the maximum number of reasoning steps.")
