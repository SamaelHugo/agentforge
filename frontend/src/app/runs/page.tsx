import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function RunsIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Runs"
        title="Execution history"
        description="Pick an agent to browse its past runs — every step of reasoning and tool use is recorded and replayable."
      />
      <AgentPicker basePath="/runs" />
    </PageShell>
  );
}
