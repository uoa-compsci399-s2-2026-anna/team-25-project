import { PageHeader } from "@/features/layout/components"
import { PostProposalDialog } from "./PostProposalDialog"

export const ProposalsHeader = () => {
  return (
    <PageHeader
      actions={<PostProposalDialog />}
      description="Research ideas posted by members looking for co-investigators, data access or a second institution."
      title="Research proposals"
    />
  )
}
