import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function PlaygroundIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="02 / Playground"
        title="Put an agent to work."
        description="Choose an agent, give it a real task and inspect the execution trace only when you need the technical detail."
      />
      <AgentPicker basePath="/playground" />
    </PageShell>
  );
}
