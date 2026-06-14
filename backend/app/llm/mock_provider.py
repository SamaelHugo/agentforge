"""Deterministic mock provider.

Produces a believable ReAct trace without any API key: it inspects the
conversation and the agent's available tools, then walks a sensible tool
sequence (retrieve → act → answer) before synthesising a final answer that
references what the tools returned. This makes AgentForge fully demoable
offline — and gives a free, fast path for local development.
"""
from __future__ import annotations

from typing import Any

from .base import LLMResult, ToolCall

# Priority order the mock "agent" likes to work in.
_TOOL_PRIORITY = ["search_knowledge", "web_search", "draft_email", "save_to_db"]
_MAX_TOOL_STEPS = 3


def _text_of(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        return "\n".join(parts)
    return ""


def _first_user_text(messages: list[dict]) -> str:
    for msg in messages:
        if msg.get("role") == "user":
            txt = _text_of(msg.get("content"))
            if txt:
                return txt
    return ""


def _count_tool_turns(messages: list[dict]) -> int:
    count = 0
    for msg in messages:
        if msg.get("role") != "assistant":
            continue
        content = msg.get("content")
        if isinstance(content, list) and any(
            isinstance(b, dict) and b.get("type") == "tool_use" for b in content
        ):
            count += 1
    return count


def _last_tool_result(messages: list[dict]) -> str:
    for msg in reversed(messages):
        if msg.get("role") != "user":
            continue
        content = msg.get("content")
        if isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "tool_result":
                    return _stringify(block.get("content"))
    return ""


def _stringify(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            b.get("text", "") for b in content if isinstance(b, dict)
        )
    return str(content or "")


def _schema_for(tools: list[dict], name: str) -> dict:
    for tool in tools:
        if tool.get("name") == name:
            return tool.get("input_schema", {}) or {}
    return {}


def _fill_inputs(schema: dict, query: str, tool_name: str) -> dict[str, Any]:
    props: dict = schema.get("properties", {}) or {}
    required: list[str] = schema.get("required", list(props.keys())) or list(props.keys())
    snippet = query.strip()[:160] or "the user's request"
    out: dict[str, Any] = {}
    for key in required:
        spec = props.get(key, {})
        ptype = spec.get("type", "string")
        lname = key.lower()
        if ptype == "integer" or ptype == "number":
            out[key] = 3
        elif ptype == "boolean":
            out[key] = True
        elif ptype == "array":
            out[key] = [snippet]
        elif ptype == "object":
            out[key] = {}
        elif any(k in lname for k in ("query", "question", "search", "q")):
            out[key] = snippet
        elif any(k in lname for k in ("recipient", "email", "to")):
            out[key] = "prospect@example.com"
        elif "subject" in lname:
            out[key] = f"Following up on: {snippet[:60]}"
        elif "title" in lname or "name" in lname:
            out[key] = snippet[:80]
        elif "kind" in lname or "type" in lname:
            out[key] = "record"
        else:  # body / content / message / notes / key_points / summary …
            out[key] = (
                f"Drafted from the request '{snippet}'. Key points addressed "
                "using the agent's knowledge base."
            )
    return out


def _thinking_for(tool_name: str, step: int, query: str) -> str:
    plans = {
        "search_knowledge": (
            f"The user asked: \"{query[:120]}\". Before answering I should ground "
            "myself in the knowledge base, so I'll run a semantic search for the "
            "most relevant passages."
        ),
        "web_search": (
            "I have internal context. To make sure I'm not missing anything "
            "recent, let me check external sources as well."
        ),
        "draft_email": (
            "I now have enough context. The task calls for an outbound message, "
            "so I'll draft a concise, professional email."
        ),
        "save_to_db": (
            "Good — the result is ready. I'll persist it so it's available for "
            "later review and downstream steps."
        ),
    }
    return plans.get(tool_name, "Let me work through the next step.")


def _final_text(query: str, sequence: list[str], last_result: str) -> str:
    lines: list[str] = []
    if "search_knowledge" in sequence and last_result:
        excerpt = last_result.strip().replace("\n", " ")[:260]
        lines.append(
            f"Here's what I found for **\"{query.strip()[:140]}\"**, grounded in the "
            "agent's knowledge base:"
        )
        lines.append("")
        lines.append(f"> {excerpt}…")
        lines.append("")
        lines.append(
            "Based on those sources, my recommendation is to proceed with the "
            "approach above. I've cited the retrieved material so you can verify "
            "every claim."
        )
    else:
        lines.append(
            f"Here's my response to **\"{query.strip()[:140]}\"**. "
            "I reasoned through the request step by step and used the tools "
            "available to me to produce a grounded answer."
        )
    if "draft_email" in sequence:
        lines.append("")
        lines.append("I've also prepared a draft email you can review and send.")
    if "save_to_db" in sequence:
        lines.append("")
        lines.append("The outcome has been saved to the database for your records.")
    lines.append("")
    lines.append(
        "_(Running in offline mock mode — set ANTHROPIC_API_KEY to use Claude for "
        "live reasoning.)_"
    )
    return "\n".join(lines)


class MockProvider:
    name = "mock"

    def complete(
        self,
        *,
        system: str,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]],
        model: str,
        max_tokens: int,
        effort: str | None = None,
    ) -> LLMResult:
        query = _first_user_text(messages)
        available = [t.get("name") for t in tools]
        sequence = [n for n in _TOOL_PRIORITY if n in available][:_MAX_TOOL_STEPS]
        done = _count_tool_turns(messages)

        if done < len(sequence):
            tool_name = sequence[done]
            schema = _schema_for(tools, tool_name)
            tool_input = _fill_inputs(schema, query, tool_name)
            call = ToolCall(id=f"mock_{done}", name=tool_name, input=tool_input)
            return LLMResult(
                thinking=_thinking_for(tool_name, done, query),
                tool_calls=[call],
                stop_reason="tool_use",
                raw_assistant_content=[
                    {"type": "tool_use", "id": call.id, "name": tool_name, "input": tool_input}
                ],
                usage={"input_tokens": 0, "output_tokens": 0},
            )

        text = _final_text(query, sequence, _last_tool_result(messages))
        return LLMResult(
            text=text,
            thinking="I've gathered everything I need. Composing the final answer now.",
            stop_reason="end_turn",
            raw_assistant_content=[{"type": "text", "text": text}],
            usage={"input_tokens": 0, "output_tokens": 0},
        )
