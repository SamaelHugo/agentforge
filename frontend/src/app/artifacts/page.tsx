import { AgentPicker } from "@/components/AgentPicker";
import { PageHeader, PageShell } from "@/components/ui";

export default function ArtifactsIndexPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Artifacts"
        title="Saved agent output"
        description="Inspect records, reports, and notes created through the save_to_db tool."
      />
      <AgentPicker basePath="/artifacts" />
    </PageShell>
  );
}
