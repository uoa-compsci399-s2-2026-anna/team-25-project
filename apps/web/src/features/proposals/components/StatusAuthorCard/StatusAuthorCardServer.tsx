import { canEditProposal } from "@/features/proposals/proposals.access"
import { getProposalByIdCached } from "@/features/proposals/proposals.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { StatusAuthorCard } from "./StatusAuthorCard"

// getCurrentUser() reads headers(), which is dynamic - kept in its own
// component behind a Suspense boundary so it doesn't drag the rest of the
// proposal page along with it under cacheComponents.
export const StatusAuthorCardServer = async ({ id }: { id: number }) => {
  const proposal = await getProposalByIdCached(id)

  if (!proposal) {
    return null
  }

  if (!canEditProposal(await getCurrentUser(), proposal)) {
    return null
  }

  return <StatusAuthorCard status={proposal.status} updatedAt={proposal.updatedAt} />
}
