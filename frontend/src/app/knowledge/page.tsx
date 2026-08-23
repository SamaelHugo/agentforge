import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function KnowledgeIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="03 / Knowledge library"
        title="Ground agents in facts."
        description="Choose an agent, then add the documents it can search before answering. Every source stays visible and manageable."
      />
      <AgentPicker basePath="/knowledge" />
    </PageShell>
  );
}
