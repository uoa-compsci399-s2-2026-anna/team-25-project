import { Heading } from "@repo/ui/components/ui"
import { PostProposalDialog } from "./PostProposalDialog"

export const ProposalsHeader = () => {
  return (
    <div className="flex flex-col gap-3 px-8 py-16 md:px-16">
      <Heading level="h1">Research proposals</Heading>
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-lg text-muted-foreground">
          Research ideas posted by members looking for co-investigators, data access or a second
          institution.
        </p>
        <PostProposalDialog />
      </div>
    </div>
  )
}
