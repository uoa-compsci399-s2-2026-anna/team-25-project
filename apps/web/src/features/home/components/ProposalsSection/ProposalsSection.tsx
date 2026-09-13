import { Heading } from "@repo/ui/components/ui"
import { ProposalsPreviewPlaceholder } from "../ProposalsPreviewPlaceholder/ProposalsPreviewPlaceholder"
import { ResearchIdeaCta } from "../ResearchIdeaCta/ResearchIdeaCta"

export const ProposalsSection = () => {
  return (
    <section className="px-8 py-10 md:px-16">
      <Heading className="mb-8" level="h2">
        Research proposals
      </Heading>
      <div className="grid gap-8 md:grid-cols-2">
        <ProposalsPreviewPlaceholder />
        <ResearchIdeaCta />
      </div>
    </section>
  )
}
