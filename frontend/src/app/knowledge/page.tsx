import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function KnowledgeIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Knowledge Base"
        title="Manage an agent's documents"
        description="Upload PDFs or paste text. Documents are chunked, embedded, and made searchable for the agent's RAG tool."
      />
      <AgentPicker basePath="/knowledge" />
    </PageShell>
  );
}
