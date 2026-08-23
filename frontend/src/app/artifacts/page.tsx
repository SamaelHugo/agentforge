import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function ArtifactsIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="05 / Artifact archive"
        title="Work worth keeping."
        description="Choose an agent to inspect the reports, records and structured outputs it has saved for later use."
      />
      <AgentPicker basePath="/artifacts" />
    </PageShell>
  );
}
