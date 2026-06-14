import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function PlaygroundIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Playground"
        title="Pick an agent to run"
        description="Open the split-view playground — chat on the left, the agent's live reasoning, tool calls, and results on the right."
      />
      <AgentPicker basePath="/playground" />
    </PageShell>
  );
}
