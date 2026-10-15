import type { Proposal } from "@repo/shared/payload-types"
import type { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"

type CurrentUser = Awaited<ReturnType<typeof getCurrentUser>>

/**
 * Whether to offer this viewer the proposal's Edit controls: admins, and its authors. It mirrors
 * Payload's isAdminOrAuthors rule, which is what actually decides when they save.
 */
export const canEditProposal = (
  { collection, user }: CurrentUser,
  proposal: Pick<Proposal, "author">,
) => {
  if (collection === Slugs.Collections.ADMIN) return true
  if (!user) return false
  return proposal.author.some(
    (author) => (typeof author === "object" ? author.id : author) === user.id,
  )
}
