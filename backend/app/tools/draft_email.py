"""draft_email — compose a professional email from key points."""
from __future__ import annotations

from typing import Any

from .base import ToolContext, ToolResult


class DraftEmailTool:
    name = "draft_email"
    label = "Draft Email"
    description = (
        "Compose a concise, professional email. Provide the recipient, a subject, "
        "and the key points to cover; returns a ready-to-send draft."
    )
    icon = "mail"
    accent = "violet"
    input_schema: dict[str, Any] = {
        "type": "object",
        "properties": {
            "recipient": {"type": "string", "description": "Email address or name."},
            "subject": {"type": "string", "description": "Subject line."},
            "key_points": {
                "type": "string",
                "description": "The main points the email should communicate.",
            },
        },
        "required": ["recipient", "subject"],
    }

    def run(
        self,
        ctx: ToolContext,
        recipient: str = "",
        subject: str = "",
        key_points: str = "",
        body: str = "",
        **_: Any,
    ) -> ToolResult:
        points = (key_points or body).strip() or "Following up on our conversation."
        signature = ctx.agent.name or "The AgentForge Team"
        email = (
            f"To: {recipient}\n"
            f"Subject: {subject}\n\n"
            f"Hi,\n\n"
            f"{points}\n\n"
            f"Happy to discuss further — just let me know a good time.\n\n"
            f"Best regards,\n{signature}"
        )
        return ToolResult(
            output="Drafted email:\n\n" + email,
            data={"recipient": recipient, "subject": subject, "body": email},
        )
