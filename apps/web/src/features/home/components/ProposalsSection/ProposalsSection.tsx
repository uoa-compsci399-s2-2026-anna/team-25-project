import { Heading } from "@repo/ui/components/ui"
import { ProposalsPreviewPlaceholder } from "../ProposalsPreviewPlaceholder/ProposalsPreviewPlaceholder"

export const ProposalsSection = () => {
  return (
    <section className="px-8 py-16 md:px-16">
      <Heading className="mb-8" level="h2">
        Research proposals
      </Heading>
      <ProposalsPreviewPlaceholder />
    </section>
  )
}
