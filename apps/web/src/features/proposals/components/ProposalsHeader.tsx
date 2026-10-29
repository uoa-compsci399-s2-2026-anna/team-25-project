import { PageHeader } from "@/features/layout/components"
import { PostProposalTrigger } from "./PostProposalTrigger"

export const ProposalsHeader = () => {
  return (
    <PageHeader
      actions={<PostProposalTrigger />}
      centerOnMobile
      description="Research ideas posted by members looking for co-investigators, data access or a second institution."
      title="Research proposals"
    />
  )
}
