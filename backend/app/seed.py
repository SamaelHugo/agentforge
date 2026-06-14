"""Seed three ready-to-demo agents with their knowledge bases."""
from __future__ import annotations

from sqlalchemy.orm import Session

from .config import get_settings
from .models import Agent, AgentTool
from .rag import ingest_document

# ── Knowledge base documents ─────────────────────────────────────────────
_ICP_DOC = """Northwind Cloud — Ideal Customer Profile & Product Overview

Northwind Cloud is a B2B data integration platform that helps mid-market and
enterprise teams unify data from 200+ sources into a single warehouse without
writing pipelines by hand.

Ideal Customer Profile (ICP):
- Company size: 200–5,000 employees.
- Industries: SaaS, e-commerce, fintech, and healthcare technology.
- Buyer personas: Head of Data, VP of Engineering, Director of Analytics.
- Strong fit signals: the team already uses a cloud warehouse (Snowflake,
  BigQuery, or Redshift), has 5+ data sources, and a dedicated data team.
- Poor fit signals: companies under 50 employees, no warehouse, or no
  dedicated data/analytics function.

Pricing: usage-based, starting at $1,200/month for the Growth tier and
$4,500/month for the Enterprise tier, which adds SSO, audit logs, and a
99.9% uptime SLA.

Differentiators: 200+ pre-built connectors, automatic schema drift handling,
column-level lineage, and SOC 2 Type II compliance. Typical onboarding is two
weeks, and most customers see their first unified dashboard within 48 hours.
"""

_SUPPORT_DOC = """Northwind Cloud — Product Documentation & FAQ

Connectors: Northwind Cloud supports 200+ sources including Salesforce,
HubSpot, Stripe, PostgreSQL, MySQL, Shopify, and Google Analytics. New
connectors can be requested from the dashboard under Settings → Connectors.

Sync frequency: On the Growth tier syncs run every 6 hours. On the Enterprise
tier syncs can run as often as every 15 minutes, and you can trigger a manual
sync at any time from the connector's page.

Schema drift: When a source adds or removes a column, Northwind Cloud detects
the change automatically and updates the destination schema without breaking
existing pipelines. You can review all schema changes in the Activity log.

Security: All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).
Northwind Cloud is SOC 2 Type II compliant. Enterprise customers can enable
SSO (SAML/OIDC) and IP allowlisting.

Billing: Billing is usage-based and calculated on monthly active rows synced.
You can view current usage under Settings → Billing. Annual plans receive a
15% discount.

Resetting a connector: Go to the connector page, click "..." → "Reset", and
confirm. A reset re-syncs all historical data and may take several hours for
large sources.

Support hours: Standard support is available 9am–6pm ET on business days.
Enterprise customers receive 24/7 support with a 1-hour response SLA.
"""

_RESEARCH_DOC = """The AI Agent Market in 2026 — Internal Briefing

Demand for AI integration work grew sharply through 2025 and into 2026.
Autonomous AI agents — systems that plan, call tools, and act with minimal
human input — are the fastest-growing segment, with strong demand for
engineers who can build custom agent loops rather than rely solely on
off-the-shelf frameworks.

Retrieval-Augmented Generation (RAG) remains a stable, high-demand capability:
grounding model output in a company's own documents reduces hallucination and
is now considered table stakes for production assistants.

Architecturally, teams increasingly value transparent agents: being able to
see an agent's reasoning, the tools it calls, and the results it gets back
("execution tracing") is a major driver of trust and adoption. Hand-rolled
ReAct loops are favored where observability, cost control, and customization
matter more than framework convenience.

The most sought-after profile combines full-stack engineering with applied AI:
someone who can stand up a backend, design a tool-calling agent, build a RAG
pipeline, and ship a polished UI. Vector databases (pgvector, Pinecone) and
streaming UIs (Server-Sent Events) are common in these stacks.
"""


def _create_agent(
    db: Session,
    *,
    name: str,
    description: str,
    system_prompt: str,
    tools: list[str],
    docs: list[tuple[str, str]],
) -> Agent:
    settings = get_settings()
    agent = Agent(
        name=name,
        description=description,
        system_prompt=system_prompt,
        model=settings.default_model,
        settings={},
    )
    for tool_name in tools:
        agent.tools.append(AgentTool(tool_name=tool_name, config={}))
    db.add(agent)
    db.commit()
    db.refresh(agent)

    for filename, content in docs:
        ingest_document(db, agent_id=agent.id, filename=filename, text=content)
    return agent


def seed_if_empty(db: Session) -> None:
    if db.query(Agent).count() > 0:
        return

    _create_agent(
        db,
        name="Lead Qualifier",
        description="Qualifies inbound leads against the ICP, scores fit, and drafts outreach.",
        system_prompt=(
            "You are a lead qualification specialist for Northwind Cloud, a B2B "
            "data integration platform. When given a lead description: (1) search "
            "the knowledge base for the ideal customer profile and product fit, "
            "(2) assess whether the lead is a strong fit and explain why, citing "
            "the knowledge base, (3) draft a short, personalized outreach email, "
            "and (4) save qualified leads to the database. Always ground your "
            "assessment in retrieved facts — never invent product details."
        ),
        tools=["search_knowledge", "draft_email", "save_to_db"],
        docs=[("Northwind Cloud — ICP & Product Overview.md", _ICP_DOC)],
    )

    _create_agent(
        db,
        name="Support Agent",
        description="Answers product questions from the docs (RAG) and escalates when unsure.",
        system_prompt=(
            "You are a customer support agent for Northwind Cloud. Answer user "
            "questions accurately using ONLY the product documentation in your "
            "knowledge base, and reference the relevant section. If the answer is "
            "not in the documentation, clearly say you don't know and escalate by "
            "saving an escalation record to the database. Be concise and friendly."
        ),
        tools=["search_knowledge", "save_to_db"],
        docs=[("Northwind Cloud — Product Docs & FAQ.md", _SUPPORT_DOC)],
    )

    _create_agent(
        db,
        name="Research Assistant",
        description="Researches a topic across internal docs and the web, then writes a cited report.",
        system_prompt=(
            "You are a research assistant. Given a topic: search the internal "
            "knowledge base, then the web for anything recent, synthesize the "
            "findings into a clear, well-structured report with citations, and "
            "save the final report to the database. Be rigorous and cite every "
            "claim to its source."
        ),
        tools=["search_knowledge", "web_search", "save_to_db"],
        docs=[("AI Agent Market 2026 — Briefing.md", _RESEARCH_DOC)],
    )
