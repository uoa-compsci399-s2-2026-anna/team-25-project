import { getProposalByIdCached } from "@/features/proposals/proposals.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { ProposalTitleActions } from "./ProposalTitleActions"

// getCurrentUser() reads headers(), which is dynamic - kept in its own
// component behind a Suspense boundary so it doesn't drag the rest of the
// proposal page along with it under cacheComponents.
export const ProposalTitleActionsServer = async ({ id }: { id: number }) => {
  const proposal = await getProposalByIdCached(id)

  if (!proposal) {
    return null
  }

  const { collection, user } = await getCurrentUser()
  const authorIds = proposal.author.map((author) =>
    typeof author === "object" ? author.id : author,
  )
  // Same rule as StatusAuthorCardServer: the proposal's authors, who can edit and
  // delete alike. Admins manage proposals from the admin dashboard.
  const canManage = collection === Slugs.Collections.MEMBERS && authorIds.includes(user.id)

  if (!canManage) {
    return null
  }

  return <ProposalTitleActions proposalId={id} title={proposal.title} />
}
