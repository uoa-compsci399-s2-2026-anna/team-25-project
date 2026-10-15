import { getProposalByIdCached } from "@/features/proposals/proposals.queries"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { StatusAuthorCard } from "./StatusAuthorCard"

// getCurrentUser() reads headers(), which is dynamic - kept in its own
// component behind a Suspense boundary so it doesn't drag the rest of the
// proposal page along with it under cacheComponents.
export const StatusAuthorCardServer = async ({ id }: { id: number }) => {
  const proposal = await getProposalByIdCached(id)

  if (!proposal) {
    return null
  }

  const { collection, user } = await getCurrentUser()
  const authorIds = proposal.author.map((author) =>
    typeof author === "object" ? author.id : author,
  )
  const canEditProposal =
    collection === Slugs.Collections.ADMIN || (user !== null && authorIds.includes(user.id))

  if (!canEditProposal) {
    return null
  }

  return <StatusAuthorCard status={proposal.status} updatedAt={proposal.updatedAt} />
}
