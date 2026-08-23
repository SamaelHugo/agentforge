import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function RunsIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="04 / Run archive"
        title="Execution history."
        description="Choose an agent to inspect previous work, outcomes, errors and the tool activity behind every answer."
      />
      <AgentPicker basePath="/runs" />
    </PageShell>
  );
}
